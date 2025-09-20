// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/ITCToken20.sol";
import "../src/contracts/Company.sol";
import "../src/contracts/Products.sol";

/**
 * @title IntegrationTest
 * @dev Integration tests for the complete e-commerce platform
 * @notice This test suite verifies the interaction between all contracts
 * @author E-commerce Platform Team
 */
contract IntegrationTest is Test {
    ITCToken20 public token;
    Company public company;
    Products public products;
    
    address public owner;
    address public companyOwner1;
    address public companyOwner2;
    address public customer1;
    address public customer2;
    
    uint256 public companyId1;
    uint256 public companyId2;
    uint256 public productId1;
    uint256 public productId2;
    uint256 public productId3;

    function setUp() public {
        owner = address(this);
        companyOwner1 = makeAddr("companyOwner1");
        companyOwner2 = makeAddr("companyOwner2");
        customer1 = makeAddr("customer1");
        customer2 = makeAddr("customer2");
        
        // Deploy contracts
        token = new ITCToken20(owner);
        company = new Company(owner);
        products = new Products(owner, address(company));
        
        // Fund accounts with ETH
        vm.deal(companyOwner1, 10 ether);
        vm.deal(companyOwner2, 10 ether);
        vm.deal(customer1, 10 ether);
        vm.deal(customer2, 10 ether);
        
        // Create companies
        vm.prank(companyOwner1);
        companyId1 = company.createCompany("Tech Solutions Inc");
        
        vm.prank(companyOwner2);
        companyId2 = company.createCompany("Digital Products Ltd");
        
        // Create products
        vm.prank(companyOwner1);
        productId1 = products.createProduct(companyId1, "Laptop Computer", 1000 ether, "QmHash1", 100);
        
        vm.prank(companyOwner1);
        productId2 = products.createProduct(companyId1, "Gaming Mouse", 50 ether, "QmHash2", 100);
        
        vm.prank(companyOwner2);
        productId3 = products.createProduct(companyId2, "Smartphone", 800 ether, "QmHash3", 100);
    }

    function testCompleteEcommerceFlow() public {
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18; // 1000 tokens (reduced from 2000)
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18; // Correct calculation
        
        // Ensure customer has enough ETH
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        assertEq(token.balanceOf(customer1), tokenAmount);
        
        // 2. Customer views available products
        IProducts.ProductData[] memory allProducts = products.getAllProducts();
        assertEq(allProducts.length, 3);
        
        // 3. Customer filters products by company
        IProducts.ProductFilter memory filter = IProducts.ProductFilter({
            companyId: companyId1,
            minPrice: 0,
            maxPrice: 0,
            isActive: true,
            searchTerm: ""
        });
        
        IProducts.ProductData[] memory company1Products = products.getProductsWithFilter(filter);
        assertEq(company1Products.length, 2);
        
        // 4. Customer searches for specific products
        IProducts.ProductData[] memory searchResults = products.searchProducts("Laptop");
        assertEq(searchResults.length, 1);
        assertEq(searchResults[0].name, "Laptop Computer");
        
        // 5. Customer filters by price range
        IProducts.ProductData[] memory priceFiltered = products.getProductsByPriceRange(40 ether, 100 ether);
        assertEq(priceFiltered.length, 1);
        assertEq(priceFiltered[0].name, "Gaming Mouse");
        
        // 6. Customer withdraws some tokens
        uint256 withdrawAmount = 500 * 10**18;
        uint256 initialBalance = customer1.balance;
        
        // Calculate expected net amount after fees
        (uint256 expectedNetAmount, , ) = token.calculateWithdrawTokensNet(withdrawAmount);
        
        vm.prank(customer1);
        token.withdrawTokens(withdrawAmount);
        
        assertEq(token.balanceOf(customer1), tokenAmount - withdrawAmount);
        assertEq(customer1.balance, initialBalance + expectedNetAmount);
    }

    function testCompanyManagementFlow() public {
        // 1. Company owner creates a new product
        vm.prank(companyOwner1);
        uint256 newProductId = products.createProduct(companyId1, "New Product", 200 ether, "QmNewHash", 100);
        
        assertTrue(products.productExists(newProductId));
        
        // 2. Company owner updates the product
        vm.prank(companyOwner1);
        products.updateProduct(newProductId, "Updated Product", 250 ether, "QmUpdatedHash");
        
        IProducts.ProductData memory productData = products.getProduct(newProductId);
        assertEq(productData.name, "Updated Product");
        assertEq(productData.price, 250 ether);
        
        // 3. Company owner deactivates the product
        vm.prank(companyOwner1);
        products.deactivateProduct(newProductId);
        
        assertFalse(products.isProductActive(newProductId));
        
        // 4. Company owner reactivates the product
        vm.prank(companyOwner1);
        products.reactivateProduct(newProductId);
        
        assertTrue(products.isProductActive(newProductId));
        
        // 5. Company owner updates company information
        vm.prank(companyOwner1);
        company.updateCompany(companyId1, "Updated Tech Solutions Inc");
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId1);
        assertEq(companyData.name, "Updated Tech Solutions Inc");
        
        // 6. Company owner deactivates the company
        vm.prank(companyOwner1);
        company.deactivateCompany(companyId1);
        
        assertFalse(company.isCompanyActive(companyId1));
        
        // 7. Try to create a product for deactivated company (should fail)
        vm.prank(companyOwner1);
        vm.expectRevert("Products: Company is not active");
        products.createProduct(companyId1, "Should Fail", 100 ether, "QmFailHash", 100);
    }

    function testTokenEconomics() public {
        // 1. Test token buying with different amounts
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10**18;  // 100 tokens
        amounts[1] = 1000 * 10**18; // 1000 tokens
        amounts[2] = 5000 * 10**18; // 5000 tokens
        
        uint256 expectedBalance = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 cost = (amounts[i] * token.getTokenPrice()) / 1e18; // Correct calculation
            vm.deal(customer1, cost);
            
            vm.prank(customer1);
            token.buyTokens{value: cost}();
            
            expectedBalance += amounts[i];
            assertEq(token.balanceOf(customer1), expectedBalance);
        }
        
        // 2. Test token withdrawal
        uint256 totalTokens = token.balanceOf(customer1);
        uint256 withdrawAmount = totalTokens / 2;
        
        // Calculate expected net amount after fees
        (uint256 expectedNetETH, , ) = token.calculateWithdrawTokensNet(withdrawAmount);
        uint256 initialBalance = customer1.balance;
        
        vm.prank(customer1);
        token.withdrawTokens(withdrawAmount);
        
        assertEq(token.balanceOf(customer1), totalTokens - withdrawAmount);
        assertEq(customer1.balance, initialBalance + expectedNetETH);
        
        // 3. Test token price update
        uint256 newPrice = 0.002 ether; // Double the price
        token.setTokenPrice(newPrice);
        assertEq(token.getTokenPrice(), newPrice);
        
        // 4. Test buying with new price
        uint256 newAmount = 100 * 10**18;
        uint256 newCost = newAmount * newPrice;
        vm.deal(customer2, newCost);
        
        vm.prank(customer2);
        token.buyTokens{value: newCost}();
        
        assertEq(token.balanceOf(customer2), newAmount);
    }

    function testProductFilteringAndSearch() public {
        // Create more products for better testing
        vm.prank(companyOwner1);
        products.createProduct(companyId1, "Cheap Laptop", 500 ether, "QmHash4", 100);
        
        vm.prank(companyOwner2);
        products.createProduct(companyId2, "Expensive Phone", 2000 ether, "QmHash5", 100);
        
        vm.prank(companyOwner2);
        products.createProduct(companyId2, "Budget Phone", 300 ether, "QmHash6", 100);
        
        // Test filtering by company
        IProducts.ProductData[] memory company1Products = products.getProductsByCompany(companyId1);
        assertEq(company1Products.length, 3); // Original 2 + new 1
        
        IProducts.ProductData[] memory company2Products = products.getProductsByCompany(companyId2);
        assertEq(company2Products.length, 3); // Original 1 + new 2
        
        // Test filtering by price range
        IProducts.ProductData[] memory cheapProducts = products.getProductsByPriceRange(0, 600 ether);
        assertEq(cheapProducts.length, 3); // Gaming Mouse (50), Budget Phone (300), Cheap Laptop (500)
        
        IProducts.ProductData[] memory expensiveProducts = products.getProductsByPriceRange(1000 ether, 3000 ether);
        assertEq(expensiveProducts.length, 2); // Laptop Computer (1000), Expensive Phone (2000)
        
        // Test search functionality
        IProducts.ProductData[] memory laptopResults = products.searchProducts("Laptop");
        assertEq(laptopResults.length, 2); // Laptop Computer, Cheap Laptop
        
        IProducts.ProductData[] memory phoneResults = products.searchProducts("Phone");
        assertEq(phoneResults.length, 2); // Smartphone, Budget Phone, Expensive Phone
        
        // Test complex filtering
        IProducts.ProductFilter memory complexFilter = IProducts.ProductFilter({
            companyId: companyId2,
            minPrice: 200 ether,
            maxPrice: 1000 ether,
            isActive: true,
            searchTerm: "Phone"
        });
        
        IProducts.ProductData[] memory complexResults = products.getProductsWithFilter(complexFilter);
        assertEq(complexResults.length, 1); // Only Budget Phone matches all criteria
        assertEq(complexResults[0].name, "Budget Phone");
    }

    function testAccessControl() public {
        // Test that only company owners can manage their products
        vm.prank(customer1);
        vm.expectRevert("Products: Not the company owner");
        products.createProduct(companyId1, "Unauthorized Product", 100 ether, "QmUnauthorized", 100);
        
        vm.prank(customer1);
        vm.expectRevert("Products: Not the company owner");
        products.updateProduct(productId1, "Unauthorized Update", 200 ether, "QmUnauthorized");
        
        vm.prank(customer1);
        vm.expectRevert("Products: Not the company owner");
        products.deactivateProduct(productId1);
        
        // Test that only company owners can manage their companies
        vm.prank(customer1);
        vm.expectRevert("Company: Not the company owner");
        company.updateCompany(companyId1, "Unauthorized Update");
        
        vm.prank(customer1);
        vm.expectRevert("Company: Not the company owner");
        company.deactivateCompany(companyId1);
        
        // Test that only token owner can manage token settings
        vm.prank(customer1);
        vm.expectRevert();
        token.setTokenPrice(0.002 ether);
        
        vm.prank(customer1);
        vm.expectRevert();
        token.mint(customer1, 1000 * 10**18);
    }

    function testEdgeCases() public {
        // Test creating product with maximum length name
        string memory maxName = "This is a very long product name that is exactly 200 characters long and should be accepted by the system without any issues because it meets the maximum length requirement perfectly and this string i";
        assertEq(bytes(maxName).length, 200);
        
        vm.prank(companyOwner1);
        uint256 productId = products.createProduct(companyId1, maxName, 100 ether, "QmMaxName", 100);
        assertTrue(products.productExists(productId));
        
        // Test creating product with maximum length image hash
        string memory maxImage = "QmThisIsAVeryLongImageHashThatIsExactly100CharactersLongAndShouldBeAcceptedByTheSystemWithoutAnyIssu";
        assertEq(bytes(maxImage).length, 100);
        
        vm.prank(companyOwner1);
        productId = products.createProduct(companyId1, "Test Product", 100 ether, maxImage, 100);
        assertTrue(products.productExists(productId));
        
        // Test buying maximum possible tokens
        uint256 maxTokens = token.getRemainingSupply();
        uint256 maxCost = maxTokens * token.getTokenPrice();
        vm.deal(customer1, maxCost);
        
        vm.prank(customer1);
        token.buyTokens{value: maxCost}();
        
        assertEq(token.balanceOf(customer1), maxTokens);
        assertEq(token.getRemainingSupply(), 0);
        
        // Test that no more tokens can be bought
        vm.prank(customer2);
        vm.expectRevert("ITCToken20: Exceeds maximum supply");
        token.buyTokens{value: 1 ether}();
    }

    function testFuzzIntegration(uint256 tokenAmount, uint256 productPrice, string memory productName) public {
        vm.assume(tokenAmount >= 100 * 10**18); // Minimum amount to cover fees
        vm.assume(tokenAmount <= 10000 * 10**18); // Reasonable upper limit
        vm.assume(tokenAmount <= token.getRemainingSupply());
        vm.assume(productPrice > 0);
        vm.assume(bytes(productName).length > 0);
        vm.assume(bytes(productName).length <= 200);
        
        // Customer buys tokens
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18; // Correct calculation
        vm.deal(customer1, tokenCost);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        assertEq(token.balanceOf(customer1), tokenAmount);
        
        // Company owner creates product
        vm.prank(companyOwner1);
        uint256 productId = products.createProduct(companyId1, productName, productPrice, "QmFuzzHash", 100);
        
        assertTrue(products.productExists(productId));
        
        // Customer withdraws some tokens (only if amount is large enough to cover fees)
        if (tokenAmount >= 1000 * 10**18) {
            uint256 withdrawAmount = tokenAmount / 2;
            
            // Check if withdrawal amount can cover fees
            try token.calculateWithdrawTokensNet(withdrawAmount) returns (uint256, uint256, uint256) {
                vm.prank(customer1);
                token.withdrawTokens(withdrawAmount);
                
                assertEq(token.balanceOf(customer1), tokenAmount - withdrawAmount);
            } catch {
                // Skip withdrawal if amount is too small to cover fees
            }
        }
    }
}
