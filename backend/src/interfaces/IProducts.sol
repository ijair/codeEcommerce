// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProducts
 * @dev Interface for Products contract
 * @notice This interface defines the structure and functions for managing products
 */
interface IProducts {
    /**
     * @dev Product structure
     * @param id Unique identifier for the product
     * @param companyId ID of the company that owns the product
     * @param name Name of the product
     * @param price Price of the product in wei
     * @param image IPFS hash of the product image
     * @param stock Available stock/inventory
     * @param isActive Whether the product is active
     * @param createdAt Timestamp when the product was created
     * @param updatedAt Timestamp when the product was last updated
     */
    struct ProductData {
        uint256 id;
        uint256 companyId;
        string name;
        uint256 price;
        string image;
        uint256 stock;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    /**
     * @dev Filter structure for product queries
     * @param companyId Filter by company ID (0 means all companies)
     * @param minPrice Minimum price filter (0 means no minimum)
     * @param maxPrice Maximum price filter (0 means no maximum)
     * @param isActive Filter by active status (true/false, null means all)
     * @param searchTerm Search term for product name (empty means no search)
     */
    struct ProductFilter {
        uint256 companyId;
        uint256 minPrice;
        uint256 maxPrice;
        bool isActive;
        string searchTerm;
    }

    /**
     * @dev Emitted when a new product is created
     * @param productId Unique identifier for the product
     * @param companyId ID of the company that owns the product
     * @param name Name of the product
     * @param price Price of the product
     * @param image IPFS hash of the product image
     */
    event ProductCreated(
        uint256 indexed productId,
        uint256 indexed companyId,
        string name,
        uint256 price,
        string image
    );

    /**
     * @dev Emitted when a product is updated
     * @param productId Unique identifier for the product
     * @param name New name of the product
     * @param price New price of the product
     * @param image New IPFS hash of the product image
     */
    event ProductUpdated(
        uint256 indexed productId,
        string name,
        uint256 price,
        string image
    );

    /**
     * @dev Emitted when a product is deactivated
     * @param productId Unique identifier for the product
     */
    event ProductDeactivated(uint256 indexed productId);

    /**
     * @dev Emitted when a product is reactivated
     * @param productId Unique identifier for the product
     */
    event ProductReactivated(uint256 indexed productId);

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
    ) external returns (uint256 productId);

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
    ) external;

    /**
     * @dev Deactivate a product
     * @param productId Unique identifier for the product
     */
    function deactivateProduct(uint256 productId) external;

    /**
     * @dev Reactivate a product
     * @param productId Unique identifier for the product
     */
    function reactivateProduct(uint256 productId) external;

    /**
     * @dev Get product information
     * @param productId Unique identifier for the product
     * @return product Product data structure
     */
    function getProduct(uint256 productId) external view returns (ProductData memory product);

    /**
     * @dev Get all products
     * @return products Array of all products
     */
    function getAllProducts() external view returns (ProductData[] memory products);

    /**
     * @dev Get products by company
     * @param companyId ID of the company
     * @return products Array of products owned by the company
     */
    function getProductsByCompany(uint256 companyId) external view returns (ProductData[] memory products);

    /**
     * @dev Get active products
     * @return products Array of active products
     */
    function getActiveProducts() external view returns (ProductData[] memory products);

    /**
     * @dev Get products with filters
     * @param filter Filter structure for product queries
     * @return products Array of filtered products
     */
    function getProductsWithFilter(ProductFilter memory filter) external view returns (ProductData[] memory products);

    /**
     * @dev Check if a product exists
     * @param productId Unique identifier for the product
     * @return exists True if product exists, false otherwise
     */
    function productExists(uint256 productId) external view returns (bool exists);

    /**
     * @dev Check if a product is active
     * @param productId Unique identifier for the product
     * @return isActive True if product is active, false otherwise
     */
    function isProductActive(uint256 productId) external view returns (bool isActive);

    /**
     * @dev Get total number of products
     * @return count Total number of products
     */
    function getProductCount() external view returns (uint256 count);

    /**
     * @dev Get products by price range
     * @param minPrice Minimum price in wei
     * @param maxPrice Maximum price in wei
     * @return products Array of products within the price range
     */
    function getProductsByPriceRange(uint256 minPrice, uint256 maxPrice) external view returns (ProductData[] memory products);

    /**
     * @dev Search products by name
     * @param searchTerm Search term for product name
     * @return products Array of products matching the search term
     */
    function searchProducts(string memory searchTerm) external view returns (ProductData[] memory products);

    /**
     * @dev Update product stock (called by authorized contracts)
     * @param productId Unique identifier for the product
     * @param quantity Quantity to subtract from stock
     */
    function updateProductStock(uint256 productId, uint256 quantity) external;

    /**
     * @dev Add stock to a product
     * @param productId Unique identifier for the product
     * @param quantity Quantity to add to stock
     */
    function addProductStock(uint256 productId, uint256 quantity) external;

    /**
     * @dev Get product stock
     * @param productId Unique identifier for the product
     * @return stock Current stock level
     */
    function getProductStock(uint256 productId) external view returns (uint256 stock);

    /**
     * @dev Check if product has sufficient stock
     * @param productId Unique identifier for the product
     * @param quantity Required quantity
     * @return hasStock True if sufficient stock available
     */
    function hasStockAvailable(uint256 productId, uint256 quantity) external view returns (bool hasStock);

    /**
     * @dev Authorize a contract to update stock (only owner)
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external;

    /**
     * @dev Revoke authorization from a contract (only owner)
     * @param contractAddress Address of the contract to revoke
     */
    function revokeContractAuthorization(address contractAddress) external;
}
