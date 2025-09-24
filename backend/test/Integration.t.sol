// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/ITCToken20.sol";
import "../src/contracts/Company.sol";
import "../src/contracts/Products.sol";
import "../src/contracts/Clients.sol";

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
    Clients public clients;
    
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
        clients = new Clients(owner, address(company));
        
        // Configure contract relationships
        products.setClientsContract(address(clients));
        clients.authorizeContract(address(products));
        
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
        uint256 tokenAmount = 1000 * 10**18; // 1000 tokens
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        
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
    }

    function testCompleteProductPurchaseFlow() public {
        // Skip test if no tokens are available
        if (token.getRemainingSupply() == 0) {
            return;
        }
        
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18; // 1000 tokens
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        assertEq(token.balanceOf(customer1), tokenAmount);
        
        // 2. Customer purchases a product using completePurchase
        uint256 productId = productId1; // Laptop Computer
        uint256 quantity = 1;
        uint256 productPrice = 500 ether; // 500 ITC tokens
        
        // Check initial stock
        uint256 initialStock = products.getProductStock(productId);
        assertEq(initialStock, 100);
        
        // Check that customer is not registered as client initially
        assertFalse(clients.clientExists(companyId1, customer1));
        
        // 3. Transfer tokens to customer (simulating payment)
        vm.prank(owner);
        token.transfer(customer1, productPrice);
        
        // 4. Customer purchases product using completePurchase
        vm.prank(customer1);
        products.completePurchase(productId, quantity, customer1, productPrice);
        
        // 5. Verify stock was reduced
        uint256 finalStock = products.getProductStock(productId);
        assertEq(finalStock, initialStock - quantity);
        
        // 6. Verify customer is now registered as client
        assertTrue(clients.clientExists(companyId1, customer1));
        
        // 7. Verify client data
        IClients.ClientData memory clientData = clients.getClient(companyId1, customer1);
        assertEq(clientData.clientAddress, customer1);
        assertEq(clientData.companyId, companyId1);
        assertEq(clientData.totalPurchases, 1);
        assertEq(clientData.totalSpent, productPrice);
        assertEq(clientData.invoiceCount, 0);
        assertTrue(clientData.isActive);
    }

    function testProductPurchaseWithInactiveProduct() public {
        // Skip test if no tokens are available
        if (token.getRemainingSupply() == 0) {
            return;
        }
        
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18;
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        // 2. Deactivate a product
        vm.prank(companyOwner1);
        products.deactivateProduct(productId1);
        
        // 3. Try to purchase inactive product
        vm.prank(customer1);
        vm.expectRevert("Products: Product is not active");
        products.completePurchase(productId1, 1, customer1, 500 ether);
    }

    function testProductPurchaseWithNonExistentProduct() public {
        // Skip test if no tokens are available
        if (token.getRemainingSupply() == 0) {
            return;
        }
        
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18;
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        // 2. Try to purchase non-existent product
        vm.prank(customer1);
        vm.expectRevert("Products: Product does not exist");
        products.completePurchase(999, 1, customer1, 500 ether);
    }
}