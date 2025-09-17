// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IProducts.sol";
import "../interfaces/ICompany.sol";

/**
 * @title Products
 * @dev Contract for managing products in the e-commerce platform
 * @notice This contract allows creation, updating, and management of products with filtering capabilities
 * @author E-commerce Platform Team
 */
contract Products is Ownable, IProducts {
    // Reference to the Company contract
    ICompany public companyContract;
    
    // Mapping of authorized contracts that can update stock
    mapping(address => bool) public authorizedContracts;
    
    // Mapping from product ID to product data
    mapping(uint256 => ProductData) private products;
    
    // Mapping from company ID to array of product IDs
    mapping(uint256 => uint256[]) private companyProducts;
    
    // Array of all product IDs
    uint256[] private allProductIds;
    
    // Counter for generating unique product IDs
    uint256 private productCounter = 0;
    
    // Events are inherited from IProducts interface

    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     * @param _companyContract Address of the Company contract
     */
    constructor(address initialOwner, address _companyContract) Ownable(initialOwner) {
        require(_companyContract != address(0), "Products: Invalid company contract address");
        companyContract = ICompany(_companyContract);
    }

    /**
     * @dev Create a new product
     * @param companyId ID of the company that owns the product
     * @param name Name of the product
     * @param price Price of the product in wei
     * @param image IPFS hash of the product image
     * @param stock Initial stock/inventory
     * @return productId Unique identifier for the created product
     */
    function createProduct(
        uint256 companyId,
        string memory name,
        uint256 price,
        string memory image,
        uint256 stock
    ) external override returns (uint256 productId) {
        require(companyContract.companyExists(companyId), "Products: Company does not exist");
        require(companyContract.isCompanyActive(companyId), "Products: Company is not active");
        require(bytes(name).length > 0, "Products: Name cannot be empty");
        require(bytes(name).length <= 200, "Products: Name too long");
        require(price > 0, "Products: Price must be greater than zero");
        require(bytes(image).length > 0, "Products: Image cannot be empty");
        require(bytes(image).length <= 100, "Products: Image hash too long");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(company.owner == msg.sender, "Products: Not the company owner");
        
        productCounter++;
        productId = productCounter;
        
        products[productId] = ProductData({
            id: productId,
            companyId: companyId,
            name: name,
            price: price,
            image: image,
            stock: stock,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        companyProducts[companyId].push(productId);
        allProductIds.push(productId);
        
        emit ProductCreated(productId, companyId, name, price, image);
        
        return productId;
    }

    /**
     * @dev Update product information
     * @param productId Unique identifier for the product
     * @param name New name of the product
     * @param price New price of the product in wei
     * @param image New IPFS hash of the product image
     */
    function updateProduct(
        uint256 productId,
        string memory name,
        uint256 price,
        string memory image
    ) external override {
        require(productExists(productId), "Products: Product does not exist");
        require(bytes(name).length > 0, "Products: Name cannot be empty");
        require(bytes(name).length <= 200, "Products: Name too long");
        require(price > 0, "Products: Price must be greater than zero");
        require(bytes(image).length > 0, "Products: Image cannot be empty");
        require(bytes(image).length <= 100, "Products: Image hash too long");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(products[productId].companyId);
        require(company.owner == msg.sender, "Products: Not the company owner");
        
        products[productId].name = name;
        products[productId].price = price;
        products[productId].image = image;
        products[productId].updatedAt = block.timestamp;
        
        emit ProductUpdated(productId, name, price, image);
    }

    /**
     * @dev Deactivate a product
     * @param productId Unique identifier for the product
     */
    function deactivateProduct(uint256 productId) external override {
        require(productExists(productId), "Products: Product does not exist");
        require(products[productId].isActive, "Products: Product already deactivated");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(products[productId].companyId);
        require(company.owner == msg.sender, "Products: Not the company owner");
        
        products[productId].isActive = false;
        products[productId].updatedAt = block.timestamp;
        
        emit ProductDeactivated(productId);
    }

    /**
     * @dev Reactivate a product
     * @param productId Unique identifier for the product
     */
    function reactivateProduct(uint256 productId) external override {
        require(productExists(productId), "Products: Product does not exist");
        require(!products[productId].isActive, "Products: Product already active");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(products[productId].companyId);
        require(company.owner == msg.sender, "Products: Not the company owner");
        
        products[productId].isActive = true;
        products[productId].updatedAt = block.timestamp;
        
        emit ProductReactivated(productId);
    }

    /**
     * @dev Get product information
     * @param productId Unique identifier for the product
     * @return product Product data structure
     */
    function getProduct(uint256 productId) external view override returns (ProductData memory product) {
        require(productExists(productId), "Products: Product does not exist");
        return products[productId];
    }

    /**
     * @dev Get all products
     * @return productsArray Array of all products
     */
    function getAllProducts() external view override returns (ProductData[] memory productsArray) {
        uint256 length = allProductIds.length;
        productsArray = new ProductData[](length);
        for (uint256 i; i < length;) {
            productsArray[i] = products[allProductIds[i]];
            unchecked { ++i; }
        }
        return productsArray;
    }

    /**
     * @dev Get products by company
     * @param companyId ID of the company
     * @return productsArray Array of products owned by the company
     */
    function getProductsByCompany(uint256 companyId) external view override returns (ProductData[] memory productsArray) {
        require(companyContract.companyExists(companyId), "Products: Company does not exist");
        
        uint256[] memory productIds = companyProducts[companyId];
        uint256 length = productIds.length;
        productsArray = new ProductData[](length);
        
        for (uint256 i; i < length;) {
            productsArray[i] = products[productIds[i]];
            unchecked { ++i; }
        }
        
        return productsArray;
    }

    /**
     * @dev Get active products
     * @return productsArray Array of active products
     */
    function getActiveProducts() external view override returns (ProductData[] memory productsArray) {
        uint256 length = allProductIds.length;
        uint256 activeCount;
        
        // Count active products
        for (uint256 i; i < length;) {
            if (products[allProductIds[i]].isActive) {
                unchecked { ++activeCount; }
            }
            unchecked { ++i; }
        }
        
        // Create array with active products
        productsArray = new ProductData[](activeCount);
        uint256 index;
        
        for (uint256 i; i < length;) {
            if (products[allProductIds[i]].isActive) {
                productsArray[index] = products[allProductIds[i]];
                unchecked { ++index; }
            }
            unchecked { ++i; }
        }
        
        return productsArray;
    }

    /**
     * @dev Get products with filters
     * @param filter Filter structure for product queries
     * @return productsArray Array of filtered products
     */
    function getProductsWithFilter(ProductFilter memory filter) external view override returns (ProductData[] memory productsArray) {
        uint256 length = allProductIds.length;
        uint256[] memory filteredIds = new uint256[](length);
        uint256 count;
        
        // Cache search term bytes to avoid repeated conversion
        bytes memory searchTermBytes;
        uint256 searchTermLength;
        if (bytes(filter.searchTerm).length > 0) {
            searchTermBytes = bytes(filter.searchTerm);
            searchTermLength = searchTermBytes.length;
        }
        
        for (uint256 i; i < length;) {
            uint256 productId = allProductIds[i];
            ProductData storage product = products[productId]; // Use storage reference
            
            // Early exit optimizations - check most restrictive filters first
            if (filter.companyId != 0 && product.companyId != filter.companyId) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.isActive && !product.isActive) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.minPrice > 0 && product.price < filter.minPrice) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.maxPrice > 0 && product.price > filter.maxPrice) {
                unchecked { ++i; }
                continue;
            }
            
            // Search term filter (most expensive - do last)
            if (searchTermLength > 0) {
                if (!_stringContainsOptimized(product.name, searchTermBytes, searchTermLength)) {
                    unchecked { ++i; }
                    continue;
                }
            }
            
            filteredIds[count] = productId;
            unchecked { 
                ++count;
                ++i;
            }
        }
        
        // Create result array
        productsArray = new ProductData[](count);
        for (uint256 i; i < count;) {
            productsArray[i] = products[filteredIds[i]];
            unchecked { ++i; }
        }
        
        return productsArray;
    }

    /**
     * @dev Check if a product exists
     * @param productId Unique identifier for the product
     * @return exists True if product exists, false otherwise
     */
    function productExists(uint256 productId) public view override returns (bool exists) {
        return productId > 0 && productId <= productCounter;
    }

    /**
     * @dev Check if a product is active
     * @param productId Unique identifier for the product
     * @return isActive True if product is active, false otherwise
     */
    function isProductActive(uint256 productId) external view override returns (bool isActive) {
        require(productExists(productId), "Products: Product does not exist");
        return products[productId].isActive;
    }

    /**
     * @dev Get total number of products
     * @return count Total number of products
     */
    function getProductCount() external view override returns (uint256 count) {
        return allProductIds.length;
    }

    /**
     * @dev Get products by price range
     * @param minPrice Minimum price in wei
     * @param maxPrice Maximum price in wei
     * @return productsArray Array of products within the price range
     */
    function getProductsByPriceRange(uint256 minPrice, uint256 maxPrice) external view override returns (ProductData[] memory productsArray) {
        require(minPrice <= maxPrice, "Products: Invalid price range");
        
        uint256 length = allProductIds.length;
        uint256 count;
        
        // Count matching products
        for (uint256 i; i < length;) {
            uint256 price = products[allProductIds[i]].price;
            if (price >= minPrice && price <= maxPrice) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        productsArray = new ProductData[](count);
        uint256 index;
        
        // Fill array with matching products
        for (uint256 i; i < length;) {
            uint256 price = products[allProductIds[i]].price;
            if (price >= minPrice && price <= maxPrice) {
                productsArray[index] = products[allProductIds[i]];
                unchecked { ++index; }
            }
            unchecked { ++i; }
        }
        
        return productsArray;
    }

    /**
     * @dev Search products by name
     * @param searchTerm Search term for product name
     * @return productsArray Array of products matching the search term
     */
    function searchProducts(string memory searchTerm) external view override returns (ProductData[] memory productsArray) {
        require(bytes(searchTerm).length > 0, "Products: Search term cannot be empty");
        
        uint256 length = allProductIds.length;
        bytes memory searchBytes = bytes(searchTerm);
        uint256 searchLength = searchBytes.length;
        uint256 count;
        
        // Count matching products
        for (uint256 i; i < length;) {
            if (_stringContainsOptimized(products[allProductIds[i]].name, searchBytes, searchLength)) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        productsArray = new ProductData[](count);
        uint256 index;
        
        // Fill array with matching products
        for (uint256 i; i < length;) {
            if (_stringContainsOptimized(products[allProductIds[i]].name, searchBytes, searchLength)) {
                productsArray[index] = products[allProductIds[i]];
                unchecked { ++index; }
            }
            unchecked { ++i; }
        }
        
        return productsArray;
    }

    /**
     * @dev Get product IDs by company
     * @param companyId ID of the company
     * @return productIds Array of product IDs owned by the company
     */
    function getProductIdsByCompany(uint256 companyId) external view returns (uint256[] memory productIds) {
        require(companyContract.companyExists(companyId), "Products: Company does not exist");
        return companyProducts[companyId];
    }

    /**
     * @dev Get all product IDs
     * @return productIds Array of all product IDs
     */
    function getAllProductIds() external view returns (uint256[] memory productIds) {
        return allProductIds;
    }

    /**
     * @dev Update company contract address (only owner)
     * @param newCompanyContract Address of the new company contract
     */
    function updateCompanyContract(address newCompanyContract) external onlyOwner {
        require(newCompanyContract != address(0), "Products: Invalid company contract address");
        companyContract = ICompany(newCompanyContract);
    }

    /**
     * @dev Authorize a contract to update stock (only owner)
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external override onlyOwner {
        require(contractAddress != address(0), "Products: Invalid contract address");
        authorizedContracts[contractAddress] = true;
    }

    /**
     * @dev Revoke authorization from a contract (only owner)
     * @param contractAddress Address of the contract to revoke
     */
    function revokeContractAuthorization(address contractAddress) external override onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    /**
     * @dev Update product stock (called by authorized contracts)
     * @param productId Unique identifier for the product
     * @param quantity Quantity to subtract from stock
     */
    function updateProductStock(uint256 productId, uint256 quantity) external override {
        require(productExists(productId), "Products: Product does not exist");
        require(authorizedContracts[msg.sender], "Products: Not authorized to update stock");
        require(products[productId].stock >= quantity, "Products: Insufficient stock");
        
        products[productId].stock -= quantity;
        products[productId].updatedAt = block.timestamp;
    }

    /**
     * @dev Add stock to a product
     * @param productId Unique identifier for the product
     * @param quantity Quantity to add to stock
     */
    function addProductStock(uint256 productId, uint256 quantity) external override {
        require(productExists(productId), "Products: Product does not exist");
        require(quantity > 0, "Products: Quantity must be greater than zero");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(products[productId].companyId);
        require(company.owner == msg.sender, "Products: Not the company owner");
        
        products[productId].stock += quantity;
        products[productId].updatedAt = block.timestamp;
    }

    /**
     * @dev Get product stock
     * @param productId Unique identifier for the product
     * @return stock Current stock level
     */
    function getProductStock(uint256 productId) external view override returns (uint256 stock) {
        require(productExists(productId), "Products: Product does not exist");
        return products[productId].stock;
    }

    /**
     * @dev Check if product has sufficient stock
     * @param productId Unique identifier for the product
     * @param quantity Required quantity
     * @return hasStock True if sufficient stock available
     */
    function hasStockAvailable(uint256 productId, uint256 quantity) external view override returns (bool hasStock) {
        require(productExists(productId), "Products: Product does not exist");
        return products[productId].stock >= quantity;
    }

    /**
     * @dev Internal function to check if a string contains another string
     * @param str String to search in
     * @param searchStr String to search for
     * @return True if str contains searchStr, false otherwise
     */
    function _stringContains(string memory str, string memory searchStr) internal pure returns (bool) {
        bytes memory searchBytes = bytes(searchStr);
        return _stringContainsOptimized(str, searchBytes, searchBytes.length);
    }
    
    /**
     * @dev Optimized internal function to check if a string contains a substring
     * @param str The string to search in
     * @param searchBytes The substring bytes to search for
     * @param searchLength The length of search bytes
     * @return found True if substring is found, false otherwise
     */
    function _stringContainsOptimized(string memory str, bytes memory searchBytes, uint256 searchLength) internal pure returns (bool) {
        if (searchLength == 0) return true;
        
        bytes memory strBytes = bytes(str);
        uint256 strLength = strBytes.length;
        
        if (strLength < searchLength) return false;
        
        uint256 maxIndex = strLength - searchLength;
        for (uint256 i; i <= maxIndex;) {
            bool isMatch = true;
            for (uint256 j; j < searchLength;) {
                if (strBytes[i + j] != searchBytes[j]) {
                    isMatch = false;
                    break;
                }
                unchecked { ++j; }
            }
            if (isMatch) return true;
            unchecked { ++i; }
        }
        
        return false;
    }
}
