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

    // ===== NEW TESTS FOR BURN TRACKING INTEGRATION =====

    function testTokenBurnTrackingIntegration() public {
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18; // 1000 tokens
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        assertEq(token.balanceOf(customer1), tokenAmount);
        
        // 2. Verify initial burn tracking state
        assertEq(token.getTotalBurnTransactions(), 0);
        assertEq(token.getTotalTokensBurned(), 0);
        
        // 3. Customer burns some tokens using selfBurn
        uint256 burnAmount = 200 * 10**18; // 200 tokens
        
        vm.prank(customer1);
        token.selfBurn(burnAmount);
        
        // 4. Verify burn tracking was updated
        assertEq(token.getTotalBurnTransactions(), 1);
        assertEq(token.getTotalTokensBurned(), burnAmount);
        assertEq(token.balanceOf(customer1), tokenAmount - burnAmount);
        
        // 5. Verify burn record exists
        (address burner, uint256 amount, , uint256 burnId) = token.getBurnRecord(1);
        assertEq(burner, customer1);
        assertEq(amount, burnAmount);
        assertEq(burnId, 1);
        
        // 6. Get burn statistics
        (uint256 totalBurned, uint256 totalTransactions, uint256 averageBurnAmount) = token.getBurnStatistics();
        assertEq(totalBurned, burnAmount);
        assertEq(totalTransactions, 1);
        assertEq(averageBurnAmount, burnAmount);
    }

    function testMultipleUsersBurnTracking() public {
        // 1. Both customers buy tokens
        uint256 tokenAmount = 1000 * 10**18;
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        
        vm.deal(customer1, tokenCost + 1 ether);
        vm.deal(customer2, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        vm.prank(customer2);
        token.buyTokens{value: tokenCost}();
        
        // 2. Customer1 burns tokens
        uint256 burnAmount1 = 300 * 10**18;
        vm.prank(customer1);
        token.selfBurn(burnAmount1);
        
        // 3. Customer2 burns tokens
        uint256 burnAmount2 = 150 * 10**18;
        vm.prank(customer2);
        token.selfBurn(burnAmount2);
        
        // 4. Verify cumulative tracking
        assertEq(token.getTotalBurnTransactions(), 2);
        assertEq(token.getTotalTokensBurned(), burnAmount1 + burnAmount2);
        
        // 5. Verify individual burn records
        (address burner1, uint256 amount1, , uint256 burnId1) = token.getBurnRecord(1);
        assertEq(burner1, customer1);
        assertEq(amount1, burnAmount1);
        assertEq(burnId1, 1);
        
        (address burner2, uint256 amount2, , uint256 burnId2) = token.getBurnRecord(2);
        assertEq(burner2, customer2);
        assertEq(amount2, burnAmount2);
        assertEq(burnId2, 2);
        
        // 6. Test burn records range
        (address[] memory burners, uint256[] memory amounts, , uint256[] memory burnIds) = token.getBurnRecordsRange(0, 2);
        assertEq(burners.length, 2);
        assertEq(amounts.length, 2);
        assertEq(burnIds.length, 2);
        assertEq(burners[0], customer1);
        assertEq(burners[1], customer2);
        assertEq(amounts[0], burnAmount1);
        assertEq(amounts[1], burnAmount2);
    }

    function testBurnTrackingWithWithdrawTokens() public {
        // 1. Customer buys tokens
        uint256 tokenAmount = 1000 * 10**18;
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 1 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        // 2. Customer withdraws tokens (this should trigger burn tracking)
        uint256 withdrawAmount = 400 * 10**18;
        
        uint256 initialBurnTransactions = token.getTotalBurnTransactions();
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        
        vm.prank(customer1);
        token.withdrawTokens(withdrawAmount);
        
        // 3. Note: withdrawTokens does NOT track burns - only burn() and selfBurn() do
        // So burn tracking should remain unchanged
        assertEq(token.getTotalBurnTransactions(), initialBurnTransactions);
        assertEq(token.getTotalTokensBurned(), initialTotalBurned);
        
        // 5. Verify remaining balance
        assertEq(token.balanceOf(customer1), tokenAmount - withdrawAmount);
    }

    function testCompleteEcommerceFlowWithBurnTracking() public {
        // 1. Customer buys tokens
        uint256 tokenAmount = 2000 * 10**18; // 2000 tokens
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        vm.deal(customer1, tokenCost + 2 ether);
        
        vm.prank(customer1);
        token.buyTokens{value: tokenCost}();
        
        assertEq(token.balanceOf(customer1), tokenAmount);
        
        // 2. Customer burns some tokens
        uint256 burnAmount = 500 * 10**18;
        vm.prank(customer1);
        token.selfBurn(burnAmount);
        
        assertEq(token.getTotalBurnTransactions(), 1);
        assertEq(token.getTotalTokensBurned(), burnAmount);
        assertEq(token.balanceOf(customer1), tokenAmount - burnAmount);
        
        // 3. Customer purchases a product
        uint256 productId = productId1;
        uint256 quantity = 1;
        uint256 productPrice = 300 * 10**18; // 300 ITC tokens
        
        // Transfer tokens to customer (simulating payment)
        vm.prank(owner);
        token.transfer(customer1, productPrice);
        
        // Purchase product
        vm.prank(customer1);
        products.completePurchase(productId, quantity, customer1, productPrice);
        
        // 4. Customer burns more tokens
        uint256 additionalBurn = 200 * 10**18;
        vm.prank(customer1);
        token.selfBurn(additionalBurn);
        
        // 5. Verify final burn tracking state
        assertEq(token.getTotalBurnTransactions(), 2);
        assertEq(token.getTotalTokensBurned(), burnAmount + additionalBurn);
        
        // 6. Verify burn statistics
        (uint256 totalBurned, uint256 totalTransactions, uint256 averageBurnAmount) = token.getBurnStatistics();
        assertEq(totalBurned, burnAmount + additionalBurn);
        assertEq(totalTransactions, 2);
        assertEq(averageBurnAmount, (burnAmount + additionalBurn) / 2);
        
        // 7. Verify all burn IDs
        uint256[] memory allBurnIds = token.getAllBurnIds();
        assertEq(allBurnIds.length, 2);
        assertEq(allBurnIds[0], 1);
        assertEq(allBurnIds[1], 2);
    }

    function testBurnTrackingWithCompanyOwners() public {
        // 1. Company owners buy and burn tokens
        uint256 tokenAmount = 500 * 10**18;
        uint256 tokenCost = (tokenAmount * token.getTokenPrice()) / 1e18;
        
        vm.deal(companyOwner1, tokenCost + 1 ether);
        vm.deal(companyOwner2, tokenCost + 1 ether);
        
        vm.prank(companyOwner1);
        token.buyTokens{value: tokenCost}();
        
        vm.prank(companyOwner2);
        token.buyTokens{value: tokenCost}();
        
        // 2. Company owners burn tokens
        uint256 burnAmount1 = 100 * 10**18;
        uint256 burnAmount2 = 150 * 10**18;
        
        vm.prank(companyOwner1);
        token.selfBurn(burnAmount1);
        
        vm.prank(companyOwner2);
        token.selfBurn(burnAmount2);
        
        // 3. Verify tracking
        assertEq(token.getTotalBurnTransactions(), 2);
        assertEq(token.getTotalTokensBurned(), burnAmount1 + burnAmount2);
        
        // 4. Test burn records range for company owners
        (address[] memory burners, uint256[] memory amounts, , ) = token.getBurnRecordsRange(0, 2);
        assertEq(burners.length, 2);
        assertEq(amounts.length, 2);
        assertEq(burners[0], companyOwner1);
        assertEq(burners[1], companyOwner2);
        assertEq(amounts[0], burnAmount1);
        assertEq(amounts[1], burnAmount2);
    }

    function testBurnTrackingErrorHandling() public {
        // 1. Try to burn tokens without having any
        vm.prank(customer1);
        vm.expectRevert("ITCToken20: Insufficient balance to burn");
        token.selfBurn(100 * 10**18);
        
        // 2. Try to burn zero tokens
        vm.prank(customer1);
        vm.expectRevert("ITCToken20: Amount must be greater than zero");
        token.selfBurn(0);
        
        // 3. Verify no burns were recorded
        assertEq(token.getTotalBurnTransactions(), 0);
        assertEq(token.getTotalTokensBurned(), 0);
        
        // 4. Try to get burn record with invalid ID
        vm.expectRevert("ITCToken20: Invalid burn ID");
        token.getBurnRecord(1);
        
        // 5. Try to get burn records range with invalid bounds
        vm.expectRevert("ITCToken20: Start index out of bounds");
        token.getBurnRecordsRange(1, 2);
    }
}