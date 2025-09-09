// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AuthorizedContract.sol";

/**
 * @title Product
 * @dev Contract representing a product in the e-commerce platform
 * Each product is defined by company address, id, name, price, and image
 */
contract Product is AuthorizedContract, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    // Struct to represent a product
    struct ProductData {
        address companyAddress;
        uint256 id;
        string name;
        uint256 price; // Price in ECO tokens (with 18 decimals)
        string image; // IPFS hash or URL
        bool isActive;
        uint256 stock;
        uint256 creationDate;
        uint256 totalSold;
    }
    
    // Mapping from company address to mapping of product id to product data
    mapping(address => mapping(uint256 => ProductData)) public products;
    
    // Mapping from company address to array of product ids
    mapping(address => uint256[]) public companyProducts;
    
    // Global product counter for unique IDs across all companies
    uint256 public globalProductCounter;
    
    // Mapping to check if a product exists
    mapping(address => mapping(uint256 => bool)) public productExists;
    
    // Events
    event ProductCreated(
        address indexed companyAddress, 
        uint256 indexed id, 
        string name, 
        uint256 price, 
        string image,
        uint256 stock
    );
    event ProductUpdated(
        address indexed companyAddress, 
        uint256 indexed id, 
        string name, 
        uint256 price, 
        string image
    );
    event ProductStockUpdated(address indexed companyAddress, uint256 indexed id, uint256 newStock);
    event ProductDeactivated(address indexed companyAddress, uint256 indexed id);
    event ProductActivated(address indexed companyAddress, uint256 indexed id);
    event ProductActivated(address indexed companyAddress, uint256 indexed id, uint256 quantity);
    
    // Modifiers
    modifier onlyValidCompany(address companyAddress) {
        require(companyAddress != address(0), "Product: Invalid company address");
        _;
    }
    
    modifier onlyProductOwner(address _companyAddress, uint256 _id) {
        require(
            msg.sender == _companyAddress || msg.sender == owner(),
            "Product: Only product owner or contract owner can perform this action"
        );
        _;
    }
    
    modifier onlyExistingProduct(address _companyAddress, uint256 _id) {
        require(productExists[_companyAddress][_id], "Product: Product does not exist");
        _;
    }
    
    
    /**
     * @dev Create a new product
     * @param _companyAddress Address of the company
     * @param _name Name of the product
     * @param _price Price in ECO tokens (with 18 decimals)
     * @param _image IPFS hash or URL of the product image
     * @param _stock Initial stock quantity
     * @return productId The ID of the created product
     */
    function createProduct(
        address _companyAddress,
        string memory _name,
        uint256 _price,
        string memory _image,
        uint256 _stock
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyAuthorized
        nonReentrant 
        returns (uint256 productId) 
    {
        require(bytes(_name).length > 0, "Product: Name cannot be empty");
        require(_price > 0, "Product: Price must be greater than 0");
        require(bytes(_image).length > 0, "Product: Image cannot be empty");
        require(_stock > 0, "Product: Stock must be greater than 0");
        
        // Generate unique product ID
        productId = ++globalProductCounter;
        
        ProductData memory newProduct = ProductData({
            companyAddress: _companyAddress,
            id: productId,
            name: _name,
            price: _price,
            image: _image,
            isActive: true,
            stock: _stock,
            creationDate: block.timestamp,
            totalSold: 0
        });
        
        products[_companyAddress][productId] = newProduct;
        companyProducts[_companyAddress].push(productId);
        productExists[_companyAddress][productId] = true;
        
        emit ProductCreated(_companyAddress, productId, _name, _price, _image, _stock);
        return productId;
    }
    
    /**
     * @dev Update product information
     * @param _companyAddress Address of the company
     * @param _id Product ID
     * @param _name New name
     * @param _price New price
     * @param _image New image
     */
    function updateProduct(
        address _companyAddress,
        uint256 _id,
        string memory _name,
        uint256 _price,
        string memory _image
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
        onlyProductOwner(_companyAddress, _id) 
    {
        require(bytes(_name).length > 0, "Product: Name cannot be empty");
        require(_price > 0, "Product: Price must be greater than 0");
        require(bytes(_image).length > 0, "Product: Image cannot be empty");
        
        products[_companyAddress][_id].name = _name;
        products[_companyAddress][_id].price = _price;
        products[_companyAddress][_id].image = _image;
        
        emit ProductUpdated(_companyAddress, _id, _name, _price, _image);
    }
    
    /**
     * @dev Update product stock
     * @param _companyAddress Address of the company
     * @param _id Product ID
     * @param _newStock New stock quantity
     */
    function updateStock(
        address _companyAddress,
        uint256 _id,
        uint256 _newStock
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
        onlyProductOwner(_companyAddress, _id) 
    {
        products[_companyAddress][_id].stock = _newStock;
        
        emit ProductStockUpdated(_companyAddress, _id, _newStock);
    }
    
    /**
     * @dev Deactivate a product
     * @param _companyAddress Address of the company
     * @param _id Product ID
     */
    function deactivateProduct(
        address _companyAddress,
        uint256 _id
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
        onlyProductOwner(_companyAddress, _id) 
    {
        products[_companyAddress][_id].isActive = false;
        
        emit ProductDeactivated(_companyAddress, _id);
    }
    
    /**
     * @dev Activate a product
     * @param _companyAddress Address of the company
     * @param _id Product ID
     */
    function activateProduct(
        address _companyAddress,
        uint256 _id
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
        onlyProductOwner(_companyAddress, _id) 
    {
        products[_companyAddress][_id].isActive = true;
        
        emit ProductActivated(_companyAddress, _id);
    }
    
    /**
     * @dev Process product sale (called by ecommerce contract)
     * @param _companyAddress Address of the company
     * @param _id Product ID
     * @param _quantity Quantity sold
     */
    function processSale(
        address _companyAddress,
        uint256 _id,
        uint256 _quantity
    ) 
        external 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
    {
        require(_quantity > 0, "Product: Quantity must be greater than 0");
        require(
            products[_companyAddress][_id].stock >= _quantity,
            "Product: Insufficient stock"
        );
        require(
            products[_companyAddress][_id].isActive,
            "Product: Product is not active"
        );
        
        products[_companyAddress][_id].stock -= _quantity;
        products[_companyAddress][_id].totalSold += _quantity;
        
        emit ProductActivated(_companyAddress, _id, _quantity);
    }
    
    /**
     * @dev Get product data
     * @param _companyAddress Address of the company
     * @param _id Product ID
     * @return ProductData struct containing all product information
     */
    function getProductData(
        address _companyAddress,
        uint256 _id
    ) 
        external 
        view 
        onlyValidCompany(_companyAddress) 
        onlyExistingProduct(_companyAddress, _id) 
        returns (ProductData memory) 
    {
        return products[_companyAddress][_id];
    }
    
    /**
     * @dev Get all product IDs for an company
     * @param _companyAddress Address of the company
     * @return Array of product IDs
     */
    function getCompanyProducts(address _companyAddress) 
        external 
        view 
        onlyValidCompany(_companyAddress) 
        returns (uint256[] memory) 
    {
        return companyProducts[_companyAddress];
    }
    
    /**
     * @dev Get product count for an company
     * @param companyAddress Address of the company
     * @return Number of products
     */
    function getProductCount(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256) 
    {
        return companyProducts[companyAddress].length;
    }
    
    /**
     * @dev Check if a product is available for purchase
     * @param companyAddress Address of the company
     * @param id Product ID
     * @param quantity Desired quantity
     * @return True if product is available, false otherwise
     */
    function isProductAvailable(
        address companyAddress,
        uint256 id,
        uint256 quantity
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyExistingProduct(companyAddress, id) 
        returns (bool) 
    {
        ProductData memory product = products[companyAddress][id];
        return product.isActive && product.stock >= quantity;
    }
    
    /**
     * @dev Get total number of products across all companies
     * @return Total count of products
     */
    function getTotalProducts() external view returns (uint256) {
        return globalProductCounter;
    }
    
}
