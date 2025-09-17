// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/Products.sol";
import "../src/contracts/Company.sol";

/**
 * @title ProductsTest
 * @dev Comprehensive test suite for Products contract
 */
contract ProductsTest is Test {
    Products public products;
    Company public company;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 public companyId1;
    uint256 public companyId2;
    
    event ProductCreated(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, string image);
    event ProductUpdated(uint256 indexed productId, string name, uint256 price, string image);
    event ProductDeactivated(uint256 indexed productId);
    event ProductReactivated(uint256 indexed productId);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        company = new Company(owner);
        products = new Products(owner, address(company));
        
        // Create companies
        vm.prank(user1);
        companyId1 = company.createCompany("Company 1");
        
        vm.prank(user2);
        companyId2 = company.createCompany("Company 2");
    }

    function testInitialState() public {
        assertEq(products.getProductCount(), 0);
        assertEq(products.owner(), owner);
        assertEq(address(products.companyContract()), address(company));
    }

    function testCreateProduct() public {
        string memory name = "Test Product";
        uint256 price = 1 ether;
        string memory image = "QmTestHash123";
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ProductCreated(1, companyId1, name, price, image);
        uint256 productId = products.createProduct(companyId1, name, price, image, 100);
        
        assertEq(productId, 1);
        assertEq(products.getProductCount(), 1);
        
        IProducts.ProductData memory productData = products.getProduct(productId);
        assertEq(productData.id, productId);
        assertEq(productData.companyId, companyId1);
        assertEq(productData.name, name);
        assertEq(productData.price, price);
        assertEq(productData.image, image);
        assertTrue(productData.isActive);
        assertTrue(productData.createdAt > 0);
        assertEq(productData.updatedAt, productData.createdAt);
    }

    function testCreateProductCompanyDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Products: Company does not exist");
        products.createProduct(999, "Test Product", 1 ether, "QmTestHash123", 100);
    }

    function testCreateProductCompanyNotActive() public {
        // Deactivate company
        vm.prank(user1);
        company.deactivateCompany(companyId1);
        
        vm.prank(user1);
        vm.expectRevert("Products: Company is not active");
        products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash123", 100);
    }

    function testCreateProductNotCompanyOwner() public {
        vm.prank(user3);
        vm.expectRevert("Products: Not the company owner");
        products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash123", 100);
    }

    function testCreateProductEmptyName() public {
        vm.prank(user1);
        vm.expectRevert("Products: Name cannot be empty");
        products.createProduct(companyId1, "", 1 ether, "QmTestHash123", 100);
    }

    function testCreateProductNameTooLong() public {
        string memory longName = "This is a very long product name that exceeds the maximum allowed length of 200 characters and should cause the transaction to revert because it is too long for the system to handle properly and this string needs to be even longer to actually exceed the 200 character limit";
        
        vm.prank(user1);
        vm.expectRevert("Products: Name too long");
        products.createProduct(companyId1, longName, 1 ether, "QmTestHash123", 100);
    }

    function testCreateProductZeroPrice() public {
        vm.prank(user1);
        vm.expectRevert("Products: Price must be greater than zero");
        products.createProduct(companyId1, "Test Product", 0, "QmTestHash123", 100);
    }

    function testCreateProductEmptyImage() public {
        vm.prank(user1);
        vm.expectRevert("Products: Image cannot be empty");
        products.createProduct(companyId1, "Test Product", 1 ether, "", 100);
    }

    function testCreateProductImageTooLong() public {
        string memory longImage = "QmThisIsAVeryLongImageHashThatExceedsTheMaximumAllowedLengthOf100CharactersAndShouldCauseTheTransactionToRevert";
        
        vm.prank(user1);
        vm.expectRevert("Products: Image hash too long");
        products.createProduct(companyId1, "Test Product", 1 ether, longImage, 100);
    }

    function testUpdateProduct() public {
        // Create a product first
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Original Name", 1 ether, "QmOriginalHash", 100);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        string memory newName = "Updated Name";
        uint256 newPrice = 2 ether;
        string memory newImage = "QmNewHash";
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit ProductUpdated(productId, newName, newPrice, newImage);
        products.updateProduct(productId, newName, newPrice, newImage);
        
        IProducts.ProductData memory productData = products.getProduct(productId);
        assertEq(productData.name, newName);
        assertEq(productData.price, newPrice);
        assertEq(productData.image, newImage);
        assertTrue(productData.updatedAt > productData.createdAt);
    }

    function testUpdateProductNotOwner() public {
        // Create a product first
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Original Name", 1 ether, "QmOriginalHash", 100);
        
        vm.prank(user2);
        vm.expectRevert("Products: Not the company owner");
        products.updateProduct(productId, "New Name", 2 ether, "QmNewHash");
    }

    function testUpdateProductDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Products: Product does not exist");
        products.updateProduct(999, "New Name", 2 ether, "QmNewHash");
    }

    function testDeactivateProduct() public {
        // Create a product first
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit ProductDeactivated(productId);
        products.deactivateProduct(productId);
        
        assertFalse(products.isProductActive(productId));
        
        IProducts.ProductData memory productData = products.getProduct(productId);
        assertFalse(productData.isActive);
        assertTrue(productData.updatedAt > productData.createdAt);
    }

    function testDeactivateProductNotOwner() public {
        // Create a product first
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        vm.prank(user2);
        vm.expectRevert("Products: Not the company owner");
        products.deactivateProduct(productId);
    }

    function testDeactivateProductAlreadyDeactivated() public {
        // Create and deactivate a product
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        vm.prank(user1);
        products.deactivateProduct(productId);
        
        vm.prank(user1);
        vm.expectRevert("Products: Product already deactivated");
        products.deactivateProduct(productId);
    }

    function testReactivateProduct() public {
        // Create and deactivate a product
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        vm.prank(user1);
        products.deactivateProduct(productId);
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit ProductReactivated(productId);
        products.reactivateProduct(productId);
        
        assertTrue(products.isProductActive(productId));
    }

    function testReactivateProductNotOwner() public {
        // Create and deactivate a product
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        vm.prank(user1);
        products.deactivateProduct(productId);
        
        vm.prank(user2);
        vm.expectRevert("Products: Not the company owner");
        products.reactivateProduct(productId);
    }

    function testReactivateProductAlreadyActive() public {
        // Create a product
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        vm.prank(user1);
        vm.expectRevert("Products: Product already active");
        products.reactivateProduct(productId);
    }

    function testGetAllProducts() public {
        // Create multiple products
        vm.prank(user1);
        products.createProduct(companyId1, "Product 1", 1 ether, "QmHash1", 100);
        
        vm.prank(user2);
        products.createProduct(companyId2, "Product 2", 2 ether, "QmHash2", 100);
        
        IProducts.ProductData[] memory allProducts = products.getAllProducts();
        assertEq(allProducts.length, 2);
        assertEq(allProducts[0].name, "Product 1");
        assertEq(allProducts[1].name, "Product 2");
    }

    function testGetProductsByCompany() public {
        // Create products for different companies
        vm.prank(user1);
        products.createProduct(companyId1, "Company1 Product 1", 1 ether, "QmHash1", 100);
        
        vm.prank(user1);
        products.createProduct(companyId1, "Company1 Product 2", 2 ether, "QmHash2", 100);
        
        vm.prank(user2);
        products.createProduct(companyId2, "Company2 Product 1", 3 ether, "QmHash3", 100);
        
        IProducts.ProductData[] memory company1Products = products.getProductsByCompany(companyId1);
        assertEq(company1Products.length, 2);
        assertEq(company1Products[0].name, "Company1 Product 1");
        assertEq(company1Products[1].name, "Company1 Product 2");
        
        IProducts.ProductData[] memory company2Products = products.getProductsByCompany(companyId2);
        assertEq(company2Products.length, 1);
        assertEq(company2Products[0].name, "Company2 Product 1");
    }

    function testGetActiveProducts() public {
        // Create products and deactivate one
        vm.prank(user1);
        uint256 productId1 = products.createProduct(companyId1, "Active Product", 1 ether, "QmHash1", 100);
        
        vm.prank(user1);
        uint256 productId2 = products.createProduct(companyId1, "Inactive Product", 2 ether, "QmHash2", 100);
        
        vm.prank(user1);
        products.deactivateProduct(productId2);
        
        IProducts.ProductData[] memory activeProducts = products.getActiveProducts();
        assertEq(activeProducts.length, 1);
        assertEq(activeProducts[0].name, "Active Product");
    }

    function testGetProductsWithFilter() public {
        // Create products with different attributes
        vm.prank(user1);
        products.createProduct(companyId1, "Cheap Product", 0.5 ether, "QmHash1", 100);
        
        vm.prank(user1);
        products.createProduct(companyId1, "Expensive Product", 2 ether, "QmHash2", 100);
        
        vm.prank(user2);
        products.createProduct(companyId2, "Other Company Product", 1 ether, "QmHash3", 100);
        
        // Filter by company
        IProducts.ProductFilter memory filter = IProducts.ProductFilter({
            companyId: companyId1,
            minPrice: 0,
            maxPrice: 0,
            isActive: true,
            searchTerm: ""
        });
        
        IProducts.ProductData[] memory filteredProducts = products.getProductsWithFilter(filter);
        assertEq(filteredProducts.length, 2);
        
        // Filter by price range
        filter = IProducts.ProductFilter({
            companyId: 0,
            minPrice: 1 ether,
            maxPrice: 1.5 ether,
            isActive: true,
            searchTerm: ""
        });
        
        filteredProducts = products.getProductsWithFilter(filter);
        assertEq(filteredProducts.length, 1);
        assertEq(filteredProducts[0].name, "Other Company Product");
        
        // Filter by search term
        filter = IProducts.ProductFilter({
            companyId: 0,
            minPrice: 0,
            maxPrice: 0,
            isActive: true,
            searchTerm: "Cheap"
        });
        
        filteredProducts = products.getProductsWithFilter(filter);
        assertEq(filteredProducts.length, 1);
        assertEq(filteredProducts[0].name, "Cheap Product");
    }

    function testGetProductsByPriceRange() public {
        vm.prank(user1);
        products.createProduct(companyId1, "Cheap Product", 0.5 ether, "QmHash1", 100);
        
        vm.prank(user1);
        products.createProduct(companyId1, "Expensive Product", 2 ether, "QmHash2", 100);
        
        IProducts.ProductData[] memory productsInRange = products.getProductsByPriceRange(1 ether, 3 ether);
        assertEq(productsInRange.length, 1);
        assertEq(productsInRange[0].name, "Expensive Product");
    }

    function testSearchProducts() public {
        vm.prank(user1);
        products.createProduct(companyId1, "Laptop Computer", 1000 ether, "QmHash1", 100);
        
        vm.prank(user1);
        products.createProduct(companyId1, "Desktop Computer", 1500 ether, "QmHash2", 100);
        
        vm.prank(user2);
        products.createProduct(companyId2, "Mobile Phone", 500 ether, "QmHash3", 100);
        
        IProducts.ProductData[] memory searchResults = products.searchProducts("Computer");
        assertEq(searchResults.length, 2);
        assertEq(searchResults[0].name, "Laptop Computer");
        assertEq(searchResults[1].name, "Desktop Computer");
    }

    function testProductExists() public {
        assertFalse(products.productExists(0));
        assertFalse(products.productExists(1));
        
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, "Test Product", 1 ether, "QmTestHash", 100);
        
        assertTrue(products.productExists(productId));
        assertFalse(products.productExists(productId + 1));
    }

    function testGetProductIdsByCompany() public {
        vm.prank(user1);
        uint256 productId1 = products.createProduct(companyId1, "Product 1", 1 ether, "QmHash1", 100);
        
        vm.prank(user1);
        uint256 productId2 = products.createProduct(companyId1, "Product 2", 2 ether, "QmHash2", 100);
        
        uint256[] memory productIds = products.getProductIdsByCompany(companyId1);
        assertEq(productIds.length, 2);
        assertEq(productIds[0], productId1);
        assertEq(productIds[1], productId2);
    }

    function testGetAllProductIds() public {
        vm.prank(user1);
        uint256 productId1 = products.createProduct(companyId1, "Product 1", 1 ether, "QmHash1", 100);
        
        vm.prank(user2);
        uint256 productId2 = products.createProduct(companyId2, "Product 2", 2 ether, "QmHash2", 100);
        
        uint256[] memory allIds = products.getAllProductIds();
        assertEq(allIds.length, 2);
        assertEq(allIds[0], productId1);
        assertEq(allIds[1], productId2);
    }

    function testUpdateCompanyContract() public {
        Company newCompany = new Company(owner);
        
        products.updateCompanyContract(address(newCompany));
        assertEq(address(products.companyContract()), address(newCompany));
    }

    function testUpdateCompanyContractNotOwner() public {
        Company newCompany = new Company(owner);
        
        vm.prank(user1);
        vm.expectRevert();
        products.updateCompanyContract(address(newCompany));
    }

    function testUpdateCompanyContractInvalidAddress() public {
        vm.expectRevert("Products: Invalid company contract address");
        products.updateCompanyContract(address(0));
    }

    function testFuzzCreateProduct(string memory name, uint256 price, string memory image) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(bytes(name).length <= 200);
        vm.assume(price > 0);
        vm.assume(bytes(image).length > 0);
        vm.assume(bytes(image).length <= 100);
        
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, name, price, image, 100);
        
        assertTrue(productId > 0);
        assertTrue(products.productExists(productId));
        
        IProducts.ProductData memory productData = products.getProduct(productId);
        assertEq(productData.name, name);
        assertEq(productData.price, price);
        assertEq(productData.image, image);
        assertEq(productData.companyId, companyId1);
        assertTrue(productData.isActive);
    }

    function testFuzzUpdateProduct(string memory originalName, string memory newName, uint256 originalPrice, uint256 newPrice, string memory originalImage, string memory newImage) public {
        vm.assume(bytes(originalName).length > 0);
        vm.assume(bytes(originalName).length <= 200);
        vm.assume(originalPrice > 0);
        vm.assume(bytes(originalImage).length > 0);
        vm.assume(bytes(originalImage).length <= 100);
        vm.assume(bytes(newName).length > 0);
        vm.assume(bytes(newName).length <= 200);
        vm.assume(newPrice > 0);
        vm.assume(bytes(newImage).length > 0);
        vm.assume(bytes(newImage).length <= 100);
        
        // Create product
        vm.prank(user1);
        uint256 productId = products.createProduct(companyId1, originalName, originalPrice, originalImage, 100);
        
        // Update product
        vm.prank(user1);
        products.updateProduct(productId, newName, newPrice, newImage);
        
        IProducts.ProductData memory productData = products.getProduct(productId);
        assertEq(productData.name, newName);
        assertEq(productData.price, newPrice);
        assertEq(productData.image, newImage);
    }

    // ===== NEW TESTS FOR PURCHASE FUNCTION =====

    function testPurchaseProduct() public {
        uint256 companyId = company.createCompany("Test Company");
        uint256 productId = products.createProduct(companyId, "Test Product", 1 ether, "QmHash", 100);
        
        uint256 initialStock = products.getProductStock(productId);
        uint256 purchaseQuantity = 5;
        
        // Anyone can purchase a product (reduce stock)
        vm.prank(user1);
        products.purchaseProduct(productId, purchaseQuantity);
        
        uint256 finalStock = products.getProductStock(productId);
        assertEq(finalStock, initialStock - purchaseQuantity);
    }

    function testPurchaseProductInsufficientStock() public {
        uint256 companyId = company.createCompany("Test Company");
        uint256 productId = products.createProduct(companyId, "Test Product", 1 ether, "QmHash", 5);
        
        vm.prank(user1);
        vm.expectRevert("Products: Insufficient stock");
        products.purchaseProduct(productId, 10); // Try to buy more than available
    }

    function testPurchaseProductInactiveProduct() public {
        uint256 companyId = company.createCompany("Test Company");
        uint256 productId = products.createProduct(companyId, "Test Product", 1 ether, "QmHash", 100);
        
        // Deactivate the product
        products.deactivateProduct(productId);
        
        vm.prank(user1);
        vm.expectRevert("Products: Product is not active");
        products.purchaseProduct(productId, 1);
    }

    function testPurchaseProductNonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Products: Product does not exist");
        products.purchaseProduct(999, 1);
    }

    function testPurchaseProductZeroQuantity() public {
        uint256 companyId = company.createCompany("Test Company");
        uint256 productId = products.createProduct(companyId, "Test Product", 1 ether, "QmHash", 100);
        
        vm.prank(user1);
        vm.expectRevert("Products: Quantity must be greater than zero");
        products.purchaseProduct(productId, 0);
    }
}
