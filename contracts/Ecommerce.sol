// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ITCToken.sol";
import "./Company.sol";
import "./Product.sol";
import "./Invoice.sol";
import "./Client.sol";

/**
 * @title E-commerce
 * @dev Main contract that manages the entire e-commerce platform
 * Integrates all entities and handles the complete payment flow
 */
contract Ecommerce is Ownable, ReentrancyGuard, Pausable {
    // Contract references
    ITCToken public itcToken;
    Company public companyContract;
    Product public productContract;
    Invoice public invoiceContract;
    Client public clientContract;
    
    // Platform fee (in basis points, where 10000 = 100%)
    uint256 public platformFeeBps = 100; // 1% platform fee
    
    // Treasury address for collecting platform fees
    address public treasury;
    
    // Events
    event PurchaseCompleted(
        address indexed companyAddress,
        address indexed clientAddress,
        uint256 indexed invoiceNumber,
        uint256 totalAmount,
        uint256 platformFee
    );
    event CompanyRegistered(address indexed companyAddress, string name);
    event ProductCreated(
        address indexed companyAddress,
        uint256 indexed productId,
        string name,
        uint256 price
    );
    event ClientRegistered(address indexed companyAddress, address indexed clientAddress);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ContractUpdated(string contractName, address indexed newAddress);
    
    // Modifiers
    modifier onlyValidCompany(address companyAddress) {
        require(companyAddress != address(0), "E-commerce: Invalid company address");
        _;
    }
    
    modifier onlyValidClient(address clientAddress) {
        require(clientAddress != address(0), "E-commerce: Invalid client address");
        _;
    }
    
    modifier onlyRegisteredCompany(address companyAddress) {
        require(
            companyContract.isCompanyRegistered(companyAddress),
            "E-commerce: Company not registered"
        );
        _;
    }
    
    modifier onlyActiveCompany(address companyAddress) {
        require(
            companyContract.isCompanyActive(companyAddress),
            "E-commerce: Company not active"
        );
        _;
    }
    
    constructor(
        address _itcToken,
        address _companyContract,
        address _productContract,
        address _invoiceContract,
        address _clientContract,
        address _treasury
    ) Ownable(msg.sender) {
        require(_itcToken != address(0), "E-commerce: Invalid ITC token address");
        require(_companyContract != address(0), "E-commerce: Invalid company contract address");
        require(_productContract != address(0), "E-commerce: Invalid product contract address");
        require(_invoiceContract != address(0), "E-commerce: Invalid invoice contract address");
        require(_clientContract != address(0), "E-commerce: Invalid client contract address");
        require(_treasury != address(0), "E-commerce: Invalid treasury address");
        
        itcToken = ITCToken(_itcToken);
        companyContract = Company(_companyContract);
        productContract = Product(_productContract);
        invoiceContract = Invoice(_invoiceContract);
        clientContract = Client(_clientContract);
        treasury = _treasury;
    }
    
    /**
     * @dev Register a new company
     * @param companyAddress Address of the company
     * @param name Name of the company
     */
    function registerCompany(
        address companyAddress,
        string memory name
    ) 
        external 
        onlyOwner 
        onlyValidCompany(companyAddress) 
    {
        companyContract.registerCompany(companyAddress, name);
        emit CompanyRegistered(companyAddress, name);
    }
    
    /**
     * @dev Create a new product
     * @param companyAddress Address of the company
     * @param name Name of the product
     * @param price Price in ECO tokens
     * @param image Image URL or IPFS hash
     * @param stock Initial stock quantity
     * @return productId The ID of the created product
     */
    function createProduct(
        address companyAddress,
        string memory name,
        uint256 price,
        string memory image,
        uint256 stock
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyRegisteredCompany(companyAddress) 
        onlyActiveCompany(companyAddress) 
        returns (uint256 productId) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "E-commerce: Only company owner or contract owner can create products"
        );
        
        productId = productContract.createProduct(
            companyAddress,
            name,
            price,
            image,
            stock
        );
        
        // Update company product count
        companyContract.incrementProductCount(companyAddress);
        
        emit ProductCreated(companyAddress, productId, name, price);
        return productId;
    }
    
    /**
     * @dev Register a client for an company
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     */
    function registerClient(
        address companyAddress,
        address clientAddress
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredCompany(companyAddress) 
        onlyActiveCompany(companyAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "E-commerce: Only company owner or contract owner can register clients"
        );
        
        clientContract.registerClient(companyAddress, clientAddress);
        emit ClientRegistered(companyAddress, clientAddress);
    }
    
    /**
     * @dev Process a purchase (main e-commerce function)
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     * @param productIds Array of product IDs to purchase
     * @param quantities Array of quantities for each product
     * @return invoiceNumber Invoice number of the created invoice
     */
    function processPurchase(
        address companyAddress,
        address clientAddress,
        uint256[] memory productIds,
        uint256[] memory quantities
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredCompany(companyAddress) 
        onlyActiveCompany(companyAddress) 
        whenNotPaused 
        nonReentrant 
        returns (uint256 invoiceNumber) 
    {
        require(
            productIds.length == quantities.length,
            "E-commerce: Product IDs and quantities arrays must have the same length"
        );
        require(productIds.length > 0, "E-commerce: Must purchase at least one product");
        
        // Check if client is registered
        require(
            clientContract.isClientRegistered(companyAddress, clientAddress),
            "E-commerce: Client not registered for this company"
        );
        
        // Create invoice items and calculate total
        Invoice.InvoiceItem[] memory items = new Invoice.InvoiceItem[](productIds.length);
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < productIds.length; i++) {
            require(quantities[i] > 0, "E-commerce: Quantity must be greater than 0");
            
            // Get product data
            Product.ProductData memory product = productContract.getProductData(
                companyAddress,
                productIds[i]
            );
            
            // Check if product is available
            require(
                productContract.isProductAvailable(companyAddress, productIds[i], quantities[i]),
                "E-commerce: Product not available in requested quantity"
            );
            
            // Calculate item total
            uint256 itemTotal = product.price * quantities[i];
            totalAmount += itemTotal;
            
            // Create invoice item
            items[i] = Invoice.InvoiceItem({
                productId: productIds[i],
                productName: product.name,
                quantity: quantities[i],
                unitPrice: product.price,
                totalPrice: itemTotal
            });
        }
        
        require(totalAmount > 0, "E-commerce: Total amount must be greater than 0");
        
        // Check if client has enough ITC tokens
        require(
            itcToken.balanceOf(clientAddress) >= totalAmount,
            "E-commerce: Insufficient ITC token balance"
        );
        
        // Calculate platform fee
        uint256 platformFee = (totalAmount * platformFeeBps) / 10000;
        uint256 netAmount = totalAmount - platformFee;
        
        // Transfer tokens from client to company
        require(
            itcToken.transferFrom(clientAddress, companyAddress, netAmount),
            "E-commerce: Token transfer to company failed"
        );
        
        // Transfer platform fee to treasury
        if (platformFee > 0) {
            require(
                itcToken.transferFrom(clientAddress, treasury, platformFee),
                "E-commerce: Platform fee transfer failed"
            );
        }
        
        // Process product sales (update stock)
        for (uint256 i = 0; i < productIds.length; i++) {
            productContract.processSale(companyAddress, productIds[i], quantities[i]);
        }
        
        // Create invoice
        invoiceNumber = invoiceContract.createInvoice(
            companyAddress,
            clientAddress,
            items
        );
        
        // Mark invoice as paid
        invoiceContract.markAsPaid(companyAddress, invoiceNumber, "ECO Token");
        
        // Update client's total purchases
        clientContract.updatePurchases(companyAddress, clientAddress, totalAmount);
        
        // Update company revenue
        companyContract.updateRevenue(companyAddress, netAmount);
        
        // Update company invoice count
        companyContract.incrementInvoiceCount(companyAddress);
        
        emit PurchaseCompleted(companyAddress, clientAddress, invoiceNumber, totalAmount, platformFee);
        return invoiceNumber;
    }
    
    /**
     * @dev Update platform fee
     * @param newFeeBps New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "E-commerce: Platform fee too high (max 10%)");
        
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }
    
    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "E-commerce: Invalid treasury address");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Update contract addresses
     * @param contractName Name of the contract to update
     * @param newAddress New contract address
     */
    function updateContract(string memory contractName, address newAddress) external onlyOwner {
        require(newAddress != address(0), "E-commerce: Invalid contract address");
        
        if (keccak256(bytes(contractName)) == keccak256(bytes("ITCToken"))) {
            itcToken = ITCToken(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("Company"))) {
            companyContract = Company(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("Product"))) {
            productContract = Product(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("Invoice"))) {
            invoiceContract = Invoice(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("Client"))) {
            clientContract = Client(newAddress);
        } else {
            revert("E-commerce: Unknown contract name");
        }
        
        emit ContractUpdated(contractName, newAddress);
    }
    
    /**
     * @dev Get platform statistics
     * @return totalCompanies Total number of companies
     * @return totalProducts Total number of products
     * @return totalInvoices Total number of invoices
     * @return totalClients Total number of clients
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalCompanies,
            uint256 totalProducts,
            uint256 totalInvoices,
            uint256 totalClients
        ) 
    {
        totalCompanies = companyContract.getTotalCompanies();
        totalProducts = productContract.getTotalProducts();
        totalInvoices = invoiceContract.getTotalInvoices();
        totalClients = clientContract.getTotalClients();
        
        return (totalCompanies, totalProducts, totalInvoices, totalClients);
    }
    
    /**
     * @dev Get company statistics
     * @param companyAddress Address of the company
     * @return productCount Number of products
     * @return invoiceCount Number of invoices
     * @return clientCount Number of clients
     * @return totalRevenue Total revenue
     */
    function getCompanyStats(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyRegisteredCompany(companyAddress) 
        returns (
            uint256 productCount,
            uint256 invoiceCount,
            uint256 clientCount,
            uint256 totalRevenue
        ) 
    {
        productCount = productContract.getProductCount(companyAddress);
        invoiceCount = invoiceContract.getInvoiceCount(companyAddress);
        clientCount = clientContract.getClientCount(companyAddress);
        totalRevenue = invoiceContract.getTotalRevenue(companyAddress);
        
        return (productCount, invoiceCount, clientCount, totalRevenue);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
