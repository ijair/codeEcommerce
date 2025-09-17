// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IInvoice.sol";
import "../interfaces/ICompany.sol";
import "../interfaces/IClients.sol";
import "../interfaces/IProducts.sol";
import "../interfaces/IITCToken20.sol";

/**
 * @title Invoice
 * @dev Contract for managing invoices in the e-commerce platform
 * @notice This contract allows creation, updating, and management of invoices with filtering capabilities
 * @author E-commerce Platform Team
 */
contract Invoice is Ownable, IInvoice {
    // Reference to the Company contract
    ICompany public companyContract;
    
    // Reference to the Clients contract
    IClients public clientsContract;
    
    // Reference to the Products contract
    IProducts public productsContract;
    
    // Reference to the Token contract
    IITCToken20 public tokenContract;
    
    // Mapping from invoice ID to invoice data
    mapping(uint256 => InvoiceData) private invoices;
    
    // Mapping from invoice ID to array of invoice items
    mapping(uint256 => InvoiceItem[]) private invoiceItems;
    
    // Mapping from company ID to array of invoice IDs
    mapping(uint256 => uint256[]) private companyInvoices;
    
    // Mapping from client address to array of invoice IDs
    mapping(address => uint256[]) private clientInvoices;
    
    // Array of all invoice IDs
    uint256[] private allInvoiceIds;
    
    // Counter for generating unique invoice IDs
    uint256 private invoiceCounter = 0;
    
    // Events are inherited from IInvoice interface

    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     * @param _companyContract Address of the Company contract
     */
    constructor(address initialOwner, address _companyContract) Ownable(initialOwner) {
        require(_companyContract != address(0), "Invoice: Invalid company contract address");
        companyContract = ICompany(_companyContract);
    }

    /**
     * @dev Set clients contract address (only owner)
     * @param _clientsContract Address of the Clients contract
     */
    function setClientsContract(address _clientsContract) external onlyOwner {
        require(_clientsContract != address(0), "Invoice: Invalid clients contract address");
        clientsContract = IClients(_clientsContract);
    }

    /**
     * @dev Set products contract address (only owner)
     * @param _productsContract Address of the Products contract
     */
    function setProductsContract(address _productsContract) external override onlyOwner {
        require(_productsContract != address(0), "Invoice: Invalid products contract address");
        productsContract = IProducts(_productsContract);
    }

    /**
     * @dev Set token contract address (only owner)
     * @param _tokenContract Address of the ITCToken20 contract
     */
    function setTokenContract(address _tokenContract) external override onlyOwner {
        require(_tokenContract != address(0), "Invoice: Invalid token contract address");
        tokenContract = IITCToken20(_tokenContract);
    }

    /**
     * @dev Create a new invoice
     * @param companyId ID of the company creating the invoice
     * @param number Invoice number
     * @param clientAddress Address of the client
     * @param totalAmount Total amount of the invoice in wei
     * @return invoiceId Unique identifier for the created invoice
     */
    function createInvoice(
        uint256 companyId,
        uint256 number,
        address clientAddress,
        uint256 totalAmount
    ) external override returns (uint256 invoiceId) {
        require(companyContract.companyExists(companyId), "Invoice: Company does not exist");
        require(companyContract.isCompanyActive(companyId), "Invoice: Company is not active");
        require(clientAddress != address(0), "Invoice: Invalid client address");
        require(totalAmount > 0, "Invoice: Total amount must be greater than zero");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(company.owner == msg.sender, "Invoice: Not the company owner");
        
        invoiceCounter++;
        invoiceId = invoiceCounter;
        
        invoices[invoiceId] = InvoiceData({
            id: invoiceId,
            companyId: companyId,
            number: number,
            date: block.timestamp,
            clientAddress: clientAddress,
            totalAmount: totalAmount,
            isPaid: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        companyInvoices[companyId].push(invoiceId);
        clientInvoices[clientAddress].push(invoiceId);
        allInvoiceIds.push(invoiceId);
        
        // Automatically register client purchase if clients contract is set
        if (address(clientsContract) != address(0)) {
            clientsContract.registerClientPurchase(companyId, clientAddress, totalAmount);
            // Increment invoice count for the client
            clientsContract.incrementInvoiceCount(companyId, clientAddress);
        }
        
        emit InvoiceCreated(invoiceId, companyId, number, clientAddress, totalAmount);
        
        return invoiceId;
    }

    /**
     * @dev Create a new invoice with products and handle stock/token updates
     * @param companyId ID of the company creating the invoice
     * @param number Invoice number
     * @param clientAddress Address of the client
     * @param items Array of invoice items (products and quantities)
     * @param useTokens Whether to deduct tokens from client's balance
     * @return invoiceId Unique identifier for the created invoice
     */
    function createInvoiceWithProducts(
        uint256 companyId,
        uint256 number,
        address clientAddress,
        InvoiceItem[] memory items,
        bool useTokens
    ) external override returns (uint256 invoiceId) {
        require(companyContract.companyExists(companyId), "Invoice: Company does not exist");
        require(companyContract.isCompanyActive(companyId), "Invoice: Company is not active");
        require(clientAddress != address(0), "Invoice: Invalid client address");
        require(items.length > 0, "Invoice: No items provided");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(company.owner == msg.sender, "Invoice: Not the company owner");
        
        // Calculate total amount and validate stock
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < items.length; i++) {
            require(items[i].quantity > 0, "Invoice: Item quantity must be greater than zero");
            
            // Check if product exists and has sufficient stock
            if (address(productsContract) != address(0)) {
                require(productsContract.productExists(items[i].productId), "Invoice: Product does not exist");
                require(
                    productsContract.hasStockAvailable(items[i].productId, items[i].quantity),
                    "Invoice: Insufficient stock"
                );
            }
            
            totalAmount += items[i].totalPrice;
        }
        
        require(totalAmount > 0, "Invoice: Total amount must be greater than zero");
        
        // If using tokens, check balance and deduct tokens
        if (useTokens && address(tokenContract) != address(0)) {
            require(
                tokenContract.balanceOf(clientAddress) >= totalAmount,
                "Invoice: Insufficient token balance"
            );
            
            // Transfer tokens from client to company owner
            tokenContract.transferFrom(clientAddress, company.owner, totalAmount);
        }
        
        // Create invoice
        invoiceCounter++;
        invoiceId = invoiceCounter;
        
        invoices[invoiceId] = InvoiceData({
            id: invoiceId,
            companyId: companyId,
            number: number,
            date: block.timestamp,
            clientAddress: clientAddress,
            totalAmount: totalAmount,
            isPaid: useTokens, // If tokens used, mark as paid immediately
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        // Store invoice items
        for (uint256 i = 0; i < items.length; i++) {
            invoiceItems[invoiceId].push(items[i]);
        }
        
        companyInvoices[companyId].push(invoiceId);
        clientInvoices[clientAddress].push(invoiceId);
        allInvoiceIds.push(invoiceId);
        
        // Update product stock if products contract is set
        if (address(productsContract) != address(0)) {
            for (uint256 i = 0; i < items.length; i++) {
                productsContract.updateProductStock(items[i].productId, items[i].quantity);
            }
        }
        
        // Register client purchase if clients contract is set
        if (address(clientsContract) != address(0)) {
            clientsContract.registerClientPurchase(companyId, clientAddress, totalAmount);
            clientsContract.incrementInvoiceCount(companyId, clientAddress);
        }
        
        emit InvoiceCreated(invoiceId, companyId, number, clientAddress, totalAmount);
        
        return invoiceId;
    }

    /**
     * @dev Get invoice items
     * @param invoiceId Unique identifier for the invoice
     * @return items Array of invoice items
     */
    function getInvoiceItems(uint256 invoiceId) external view override returns (InvoiceItem[] memory items) {
        require(invoiceExists(invoiceId), "Invoice: Invoice does not exist");
        return invoiceItems[invoiceId];
    }

    /**
     * @dev Update invoice information
     * @param invoiceId Unique identifier for the invoice
     * @param totalAmount New total amount of the invoice
     */
    function updateInvoice(uint256 invoiceId, uint256 totalAmount) external override {
        require(invoiceExists(invoiceId), "Invoice: Invoice does not exist");
        require(totalAmount > 0, "Invoice: Total amount must be greater than zero");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(invoices[invoiceId].companyId);
        require(company.owner == msg.sender, "Invoice: Not the company owner");
        
        invoices[invoiceId].totalAmount = totalAmount;
        invoices[invoiceId].updatedAt = block.timestamp;
        
        emit InvoiceUpdated(invoiceId, totalAmount);
    }

    /**
     * @dev Mark invoice as paid
     * @param invoiceId Unique identifier for the invoice
     */
    function markInvoiceAsPaid(uint256 invoiceId) external override {
        require(invoiceExists(invoiceId), "Invoice: Invoice does not exist");
        require(!invoices[invoiceId].isPaid, "Invoice: Invoice already paid");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(invoices[invoiceId].companyId);
        require(company.owner == msg.sender, "Invoice: Not the company owner");
        
        invoices[invoiceId].isPaid = true;
        invoices[invoiceId].updatedAt = block.timestamp;
        
        emit InvoicePaid(invoiceId);
    }

    /**
     * @dev Get invoice information
     * @param invoiceId Unique identifier for the invoice
     * @return invoice Invoice data structure
     */
    function getInvoice(uint256 invoiceId) external view override returns (InvoiceData memory invoice) {
        require(invoiceExists(invoiceId), "Invoice: Invoice does not exist");
        return invoices[invoiceId];
    }

    /**
     * @dev Get all invoices
     * @return invoicesArray Array of all invoices
     */
    function getAllInvoices() external view override returns (InvoiceData[] memory invoicesArray) {
        uint256 length = allInvoiceIds.length;
        invoicesArray = new InvoiceData[](length);
        for (uint256 i; i < length;) {
            invoicesArray[i] = invoices[allInvoiceIds[i]];
            unchecked { ++i; }
        }
        return invoicesArray;
    }

    /**
     * @dev Get invoices by company
     * @param companyId ID of the company
     * @return invoicesArray Array of invoices for the company
     */
    function getInvoicesByCompany(uint256 companyId) external view override returns (InvoiceData[] memory invoicesArray) {
        require(companyContract.companyExists(companyId), "Invoice: Company does not exist");
        
        uint256[] memory invoiceIds = companyInvoices[companyId];
        uint256 length = invoiceIds.length;
        invoicesArray = new InvoiceData[](length);
        
        for (uint256 i; i < length;) {
            invoicesArray[i] = invoices[invoiceIds[i]];
            unchecked { ++i; }
        }
        
        return invoicesArray;
    }

    /**
     * @dev Get invoices by client
     * @param clientAddress Address of the client
     * @return invoicesArray Array of invoices for the client
     */
    function getInvoicesByClient(address clientAddress) external view override returns (InvoiceData[] memory invoicesArray) {
        require(clientAddress != address(0), "Invoice: Invalid client address");
        
        uint256[] memory invoiceIds = clientInvoices[clientAddress];
        uint256 length = invoiceIds.length;
        invoicesArray = new InvoiceData[](length);
        
        for (uint256 i; i < length;) {
            invoicesArray[i] = invoices[invoiceIds[i]];
            unchecked { ++i; }
        }
        
        return invoicesArray;
    }

    /**
     * @dev Get invoices with filters
     * @param filter Filter structure for invoice queries
     * @return invoicesArray Array of filtered invoices
     */
    function getInvoicesWithFilter(InvoiceFilter memory filter) external view override returns (InvoiceData[] memory invoicesArray) {
        uint256 length = allInvoiceIds.length;
        uint256[] memory filteredIds = new uint256[](length);
        uint256 count;
        
        for (uint256 i; i < length;) {
            uint256 invoiceId = allInvoiceIds[i];
            InvoiceData storage invoice = invoices[invoiceId];
            
            // Apply filters with early exit optimization
            if (filter.companyId != 0 && invoice.companyId != filter.companyId) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.clientAddress != address(0) && invoice.clientAddress != filter.clientAddress) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.fromDate > 0 && invoice.date < filter.fromDate) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.toDate > 0 && invoice.date > filter.toDate) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.minAmount > 0 && invoice.totalAmount < filter.minAmount) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.maxAmount > 0 && invoice.totalAmount > filter.maxAmount) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.isPaid && !invoice.isPaid) {
                unchecked { ++i; }
                continue;
            }
            
            filteredIds[count] = invoiceId;
            unchecked { 
                ++count;
                ++i;
            }
        }
        
        // Create result array
        invoicesArray = new InvoiceData[](count);
        for (uint256 i; i < count;) {
            invoicesArray[i] = invoices[filteredIds[i]];
            unchecked { ++i; }
        }
        
        return invoicesArray;
    }

    /**
     * @dev Get invoice statistics for a company
     * @param companyId ID of the company
     * @return stats Invoice statistics
     */
    function getInvoiceStatsByCompany(uint256 companyId) external view override returns (InvoiceStats memory stats) {
        require(companyContract.companyExists(companyId), "Invoice: Company does not exist");
        
        uint256[] memory invoiceIds = companyInvoices[companyId];
        uint256 length = invoiceIds.length;
        
        stats.totalInvoices = length;
        
        for (uint256 i; i < length;) {
            InvoiceData storage invoice = invoices[invoiceIds[i]];
            stats.totalAmount += invoice.totalAmount;
            
            if (invoice.isPaid) {
                unchecked { ++stats.paidInvoices; }
                stats.paidAmount += invoice.totalAmount;
            } else {
                unchecked { ++stats.unpaidInvoices; }
                stats.unpaidAmount += invoice.totalAmount;
            }
            
            unchecked { ++i; }
        }
        
        return stats;
    }

    /**
     * @dev Get invoice statistics for a client
     * @param clientAddress Address of the client
     * @return stats Invoice statistics
     */
    function getInvoiceStatsByClient(address clientAddress) external view override returns (InvoiceStats memory stats) {
        require(clientAddress != address(0), "Invoice: Invalid client address");
        
        uint256[] memory invoiceIds = clientInvoices[clientAddress];
        uint256 length = invoiceIds.length;
        
        stats.totalInvoices = length;
        
        for (uint256 i; i < length;) {
            InvoiceData storage invoice = invoices[invoiceIds[i]];
            stats.totalAmount += invoice.totalAmount;
            
            if (invoice.isPaid) {
                unchecked { ++stats.paidInvoices; }
                stats.paidAmount += invoice.totalAmount;
            } else {
                unchecked { ++stats.unpaidInvoices; }
                stats.unpaidAmount += invoice.totalAmount;
            }
            
            unchecked { ++i; }
        }
        
        return stats;
    }

    /**
     * @dev Check if an invoice exists
     * @param invoiceId Unique identifier for the invoice
     * @return exists True if invoice exists, false otherwise
     */
    function invoiceExists(uint256 invoiceId) public view override returns (bool exists) {
        return invoiceId > 0 && invoiceId <= invoiceCounter;
    }

    /**
     * @dev Get total number of invoices
     * @return count Total number of invoices
     */
    function getInvoiceCount() external view override returns (uint256 count) {
        return allInvoiceIds.length;
    }

    /**
     * @dev Get all invoice IDs
     * @return invoiceIds Array of all invoice IDs
     */
    function getAllInvoiceIds() external view override returns (uint256[] memory invoiceIds) {
        return allInvoiceIds;
    }

    /**
     * @dev Get invoice IDs by company
     * @param companyId ID of the company
     * @return invoiceIds Array of invoice IDs for the company
     */
    function getInvoiceIdsByCompany(uint256 companyId) external view override returns (uint256[] memory invoiceIds) {
        require(companyContract.companyExists(companyId), "Invoice: Company does not exist");
        return companyInvoices[companyId];
    }

    /**
     * @dev Get invoice IDs by client
     * @param clientAddress Address of the client
     * @return invoiceIds Array of invoice IDs for the client
     */
    function getInvoiceIdsByClient(address clientAddress) external view override returns (uint256[] memory invoiceIds) {
        require(clientAddress != address(0), "Invoice: Invalid client address");
        return clientInvoices[clientAddress];
    }

    /**
     * @dev Update company contract address (only owner)
     * @param newCompanyContract Address of the new company contract
     */
    function updateCompanyContract(address newCompanyContract) external onlyOwner {
        require(newCompanyContract != address(0), "Invoice: Invalid company contract address");
        companyContract = ICompany(newCompanyContract);
    }
}
