// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/Invoice.sol";
import "../src/contracts/Company.sol";
import "../src/contracts/Products.sol";
import "../src/contracts/Clients.sol";
import "../src/contracts/ITCToken20.sol";

/**
 * @title InvoiceTest
 * @dev Test suite for Invoice contract
 */
contract InvoiceTest is Test {
    Invoice public invoice;
    Company public company;
    Products public products;
    Clients public clients;
    ITCToken20 public token;
    
    address public owner;
    address public companyOwner;
    address public customer;
    
    uint256 public companyId;
    uint256 public productId;

    function setUp() public {
        owner = address(this);
        companyOwner = makeAddr("companyOwner");
        customer = makeAddr("customer");
        
        // Deploy contracts
        token = new ITCToken20(owner);
        company = new Company(owner);
        products = new Products(owner, address(company));
        clients = new Clients(owner, address(company));
        invoice = new Invoice(owner, address(company));
        
        // Configure contract relationships
        invoice.setProductsContract(address(products));
        invoice.setClientsContract(address(clients));
        invoice.setTokenContract(address(token));
        
        products.setClientsContract(address(clients));
        clients.authorizeContract(address(products));
        
        // Authorize invoice contract to update stock and register clients
        products.authorizeContract(address(invoice));
        clients.authorizeContract(address(invoice));
        
        // Create company and product
        vm.prank(companyOwner);
        companyId = company.createCompany("Test Company");
        
        vm.prank(companyOwner);
        productId = products.createProduct(companyId, "Test Product", 100 ether, "QmHash", 10);
        
        // Fund customer with tokens
        token.transfer(customer, 1000 ether);
        vm.prank(customer);
        token.approve(address(invoice), 1000 ether);
    }

    function testInitialState() public view {
        assertEq(invoice.owner(), owner);
        assertEq(address(invoice.companyContract()), address(company));
    }

    function testCreateInvoiceForPurchase() public {
        // Prepare invoice items
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: productId,
            quantity: 2,
            unitPrice: 100 ether,
            totalPrice: 200 ether
        });
        
        // Create invoice for purchase
        vm.prank(customer);
        uint256 invoiceId = invoice.createInvoiceForPurchase(
            companyId,
            1,
            customer,
            items,
            true // useTokens
        );
        
        // Verify invoice was created
        assertTrue(invoice.invoiceExists(invoiceId));
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.companyId, companyId);
        assertEq(invoiceData.clientAddress, customer);
        assertEq(invoiceData.totalAmount, 200 ether);
        assertTrue(invoiceData.isPaid);
        
        // Verify stock was updated
        assertEq(products.getProductStock(productId), 8); // 10 - 2
        
        // Verify customer balance was deducted
        assertEq(token.balanceOf(customer), 800 ether); // 1000 - 200
        
        // Verify company owner received tokens
        assertEq(token.balanceOf(companyOwner), 200 ether);
    }

    function testCreateInvoiceForPurchaseInsufficientBalance() public {
        // Prepare invoice items with high price
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: productId,
            quantity: 1,
            unitPrice: 2000 ether, // More than customer balance
            totalPrice: 2000 ether
        });
        
        // Should fail due to insufficient balance
        vm.prank(customer);
        vm.expectRevert("Invoice: Insufficient token balance");
        invoice.createInvoiceForPurchase(
            companyId,
            1,
            customer,
            items,
            true // useTokens
        );
    }

    function testCreateInvoiceForPurchaseInsufficientStock() public {
        // Prepare invoice items with high quantity
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: productId,
            quantity: 20, // More than available stock
            unitPrice: 100 ether,
            totalPrice: 2000 ether
        });
        
        // Should fail due to insufficient stock
        vm.prank(customer);
        vm.expectRevert("Invoice: Insufficient stock");
        invoice.createInvoiceForPurchase(
            companyId,
            1,
            customer,
            items,
            true // useTokens
        );
    }

    function testCreateInvoiceForPurchaseWrongCaller() public {
        // Prepare invoice items
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: productId,
            quantity: 1,
            unitPrice: 100 ether,
            totalPrice: 100 ether
        });
        
        // Try to create invoice with wrong client address
        vm.prank(customer);
        vm.expectRevert("Invoice: Client address must match caller");
        invoice.createInvoiceForPurchase(
            companyId,
            1,
            companyOwner, // Wrong address
            items,
            true // useTokens
        );
    }

    function testCreateInvoiceForPurchaseWithoutTokens() public {
        // Prepare invoice items
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: productId,
            quantity: 1,
            unitPrice: 100 ether,
            totalPrice: 100 ether
        });
        
        // Create invoice without using tokens
        vm.prank(customer);
        uint256 invoiceId = invoice.createInvoiceForPurchase(
            companyId,
            1,
            customer,
            items,
            false // useTokens = false
        );
        
        // Verify invoice was created but not marked as paid
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.totalAmount, 100 ether);
        assertFalse(invoiceData.isPaid);
        
        // Verify no token transfer occurred
        assertEq(token.balanceOf(customer), 1000 ether);
        assertEq(token.balanceOf(companyOwner), 0);
        
        // Verify stock was still updated
        assertEq(products.getProductStock(productId), 9); // 10 - 1
    }

    function testCreateInvoiceForPurchaseProductNotBelongsToCompany() public {
        // Create another company and product
        address anotherOwner = makeAddr("anotherOwner");
        vm.prank(anotherOwner);
        uint256 anotherCompanyId = company.createCompany("Another Company");
        
        vm.prank(anotherOwner);
        uint256 anotherProductId = products.createProduct(anotherCompanyId, "Another Product", 50 ether, "QmHash2", 5);
        
        // Prepare invoice items with product from different company
        IInvoice.InvoiceItem[] memory items = new IInvoice.InvoiceItem[](1);
        items[0] = IInvoice.InvoiceItem({
            productId: anotherProductId,
            quantity: 1,
            unitPrice: 50 ether,
            totalPrice: 50 ether
        });
        
        // Should fail because product doesn't belong to the specified company
        vm.prank(customer);
        vm.expectRevert("Invoice: Product does not belong to company");
        invoice.createInvoiceForPurchase(
            companyId, // Wrong company ID
            1,
            customer,
            items,
            true // useTokens
        );
    }
}