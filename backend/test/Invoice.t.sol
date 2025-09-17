// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/Invoice.sol";
import "../src/contracts/Company.sol";

/**
 * @title InvoiceTest
 * @dev Comprehensive test suite for Invoice contract
 */
contract InvoiceTest is Test {
    Invoice public invoice;
    Company public company;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public client1;
    address public client2;
    
    uint256 public companyId1;
    uint256 public companyId2;
    
    event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, uint256 number, address indexed clientAddress, uint256 totalAmount);
    event InvoiceUpdated(uint256 indexed invoiceId, uint256 totalAmount);
    event InvoicePaid(uint256 indexed invoiceId);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        client1 = makeAddr("client1");
        client2 = makeAddr("client2");
        
        company = new Company(owner);
        invoice = new Invoice(owner, address(company));
        
        // Create companies
        vm.prank(user1);
        companyId1 = company.createCompany("Tech Solutions Inc");
        
        vm.prank(user2);
        companyId2 = company.createCompany("Digital Services LLC");
    }

    function testInitialState() public {
        assertEq(invoice.getInvoiceCount(), 0);
        assertEq(invoice.owner(), owner);
        assertEq(address(invoice.companyContract()), address(company));
    }

    function testCreateInvoice() public {
        uint256 number = 12345;
        uint256 totalAmount = 1 ether;
        
        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCreated(1, companyId1, number, client1, totalAmount);
        uint256 invoiceId = invoice.createInvoice(companyId1, number, client1, totalAmount);
        
        assertEq(invoiceId, 1);
        assertEq(invoice.getInvoiceCount(), 1);
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.id, invoiceId);
        assertEq(invoiceData.companyId, companyId1);
        assertEq(invoiceData.number, number);
        assertEq(invoiceData.clientAddress, client1);
        assertEq(invoiceData.totalAmount, totalAmount);
        assertFalse(invoiceData.isPaid);
        assertTrue(invoiceData.createdAt > 0);
        assertEq(invoiceData.updatedAt, invoiceData.createdAt);
    }

    function testCreateInvoiceCompanyDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Invoice: Company does not exist");
        invoice.createInvoice(999, 12345, client1, 1 ether);
    }

    function testCreateInvoiceCompanyNotActive() public {
        // Deactivate company
        vm.prank(user1);
        company.deactivateCompany(companyId1);
        
        vm.prank(user1);
        vm.expectRevert("Invoice: Company is not active");
        invoice.createInvoice(companyId1, 12345, client1, 1 ether);
    }

    function testCreateInvoiceNotCompanyOwner() public {
        vm.prank(user3);
        vm.expectRevert("Invoice: Not the company owner");
        invoice.createInvoice(companyId1, 12345, client1, 1 ether);
    }

    function testCreateInvoiceInvalidClientAddress() public {
        vm.prank(user1);
        vm.expectRevert("Invoice: Invalid client address");
        invoice.createInvoice(companyId1, 12345, address(0), 1 ether);
    }

    function testCreateInvoiceZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Invoice: Total amount must be greater than zero");
        invoice.createInvoice(companyId1, 12345, client1, 0);
    }

    function testUpdateInvoice() public {
        // Create an invoice first
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        uint256 newAmount = 2 ether;
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit InvoiceUpdated(invoiceId, newAmount);
        invoice.updateInvoice(invoiceId, newAmount);
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.totalAmount, newAmount);
        assertTrue(invoiceData.updatedAt > invoiceData.createdAt);
    }

    function testUpdateInvoiceDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Invoice: Invoice does not exist");
        invoice.updateInvoice(999, 2 ether);
    }

    function testUpdateInvoiceNotOwner() public {
        // Create an invoice first
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user2);
        vm.expectRevert("Invoice: Not the company owner");
        invoice.updateInvoice(invoiceId, 2 ether);
    }

    function testUpdateInvoiceZeroAmount() public {
        // Create an invoice first
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        vm.expectRevert("Invoice: Total amount must be greater than zero");
        invoice.updateInvoice(invoiceId, 0);
    }

    function testMarkInvoiceAsPaid() public {
        // Create an invoice first
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit InvoicePaid(invoiceId);
        invoice.markInvoiceAsPaid(invoiceId);
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertTrue(invoiceData.isPaid);
        assertTrue(invoiceData.updatedAt > invoiceData.createdAt);
    }

    function testMarkInvoiceAsPaidAlreadyPaid() public {
        // Create and pay an invoice
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.markInvoiceAsPaid(invoiceId);
        
        vm.prank(user1);
        vm.expectRevert("Invoice: Invoice already paid");
        invoice.markInvoiceAsPaid(invoiceId);
    }

    function testGetAllInvoices() public {
        // Create multiple invoices
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user2);
        invoice.createInvoice(companyId2, 67890, client2, 2 ether);
        
        IInvoice.InvoiceData[] memory allInvoices = invoice.getAllInvoices();
        assertEq(allInvoices.length, 2);
        assertEq(allInvoices[0].number, 12345);
        assertEq(allInvoices[1].number, 67890);
    }

    function testGetInvoicesByCompany() public {
        // Create invoices for different companies
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12346, client2, 2 ether);
        
        vm.prank(user2);
        invoice.createInvoice(companyId2, 67890, client1, 3 ether);
        
        IInvoice.InvoiceData[] memory company1Invoices = invoice.getInvoicesByCompany(companyId1);
        assertEq(company1Invoices.length, 2);
        assertEq(company1Invoices[0].number, 12345);
        assertEq(company1Invoices[1].number, 12346);
        
        IInvoice.InvoiceData[] memory company2Invoices = invoice.getInvoicesByCompany(companyId2);
        assertEq(company2Invoices.length, 1);
        assertEq(company2Invoices[0].number, 67890);
    }

    function testGetInvoicesByClient() public {
        // Create invoices for different clients
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12346, client1, 2 ether);
        
        vm.prank(user2);
        invoice.createInvoice(companyId2, 67890, client2, 3 ether);
        
        IInvoice.InvoiceData[] memory client1Invoices = invoice.getInvoicesByClient(client1);
        assertEq(client1Invoices.length, 2);
        assertEq(client1Invoices[0].clientAddress, client1);
        assertEq(client1Invoices[1].clientAddress, client1);
        
        IInvoice.InvoiceData[] memory client2Invoices = invoice.getInvoicesByClient(client2);
        assertEq(client2Invoices.length, 1);
        assertEq(client2Invoices[0].clientAddress, client2);
    }

    function testGetInvoicesWithFilter() public {
        // Create invoices with different attributes
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12346, client2, 2 ether);
        
        vm.prank(user2);
        invoice.createInvoice(companyId2, 67890, client1, 3 ether);
        
        // Mark one invoice as paid
        vm.prank(user1);
        invoice.markInvoiceAsPaid(invoiceId1);
        
        // Filter by company
        IInvoice.InvoiceFilter memory filter = IInvoice.InvoiceFilter({
            companyId: companyId1,
            clientAddress: address(0),
            isPaid: false,
            fromDate: 0,
            toDate: 0,
            minAmount: 0,
            maxAmount: 0
        });
        
        IInvoice.InvoiceData[] memory filteredInvoices = invoice.getInvoicesWithFilter(filter);
        assertEq(filteredInvoices.length, 2);
        
        // Filter by paid status
        filter = IInvoice.InvoiceFilter({
            companyId: 0,
            clientAddress: address(0),
            isPaid: true,
            fromDate: 0,
            toDate: 0,
            minAmount: 0,
            maxAmount: 0
        });
        
        filteredInvoices = invoice.getInvoicesWithFilter(filter);
        assertEq(filteredInvoices.length, 1);
        assertTrue(filteredInvoices[0].isPaid);
        
        // Filter by amount range
        filter = IInvoice.InvoiceFilter({
            companyId: 0,
            clientAddress: address(0),
            isPaid: false,
            fromDate: 0,
            toDate: 0,
            minAmount: 1.5 ether,
            maxAmount: 3.5 ether
        });
        
        filteredInvoices = invoice.getInvoicesWithFilter(filter);
        assertEq(filteredInvoices.length, 2); // 2 ether and 3 ether invoices
    }

    function testGetInvoiceStatsByCompany() public {
        // Create invoices for company1
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12346, client2, 2 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12347, client1, 3 ether);
        
        // Mark one invoice as paid
        vm.prank(user1);
        invoice.markInvoiceAsPaid(invoiceId1);
        
        IInvoice.InvoiceStats memory stats = invoice.getInvoiceStatsByCompany(companyId1);
        
        assertEq(stats.totalInvoices, 3);
        assertEq(stats.paidInvoices, 1);
        assertEq(stats.unpaidInvoices, 2);
        assertEq(stats.totalAmount, 6 ether);
        assertEq(stats.paidAmount, 1 ether);
        assertEq(stats.unpaidAmount, 5 ether);
    }

    function testGetInvoiceStatsByClient() public {
        // Create invoices for client1
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        invoice.createInvoice(companyId1, 12346, client1, 2 ether);
        
        vm.prank(user2);
        invoice.createInvoice(companyId2, 67890, client1, 3 ether);
        
        // Mark one invoice as paid
        vm.prank(user1);
        invoice.markInvoiceAsPaid(invoiceId1);
        
        IInvoice.InvoiceStats memory stats = invoice.getInvoiceStatsByClient(client1);
        
        assertEq(stats.totalInvoices, 3);
        assertEq(stats.paidInvoices, 1);
        assertEq(stats.unpaidInvoices, 2);
        assertEq(stats.totalAmount, 6 ether);
        assertEq(stats.paidAmount, 1 ether);
        assertEq(stats.unpaidAmount, 5 ether);
    }

    function testInvoiceExists() public {
        assertFalse(invoice.invoiceExists(0));
        assertFalse(invoice.invoiceExists(1));
        
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        assertTrue(invoice.invoiceExists(invoiceId));
        assertFalse(invoice.invoiceExists(invoiceId + 1));
    }

    function testGetInvoiceIdsByCompany() public {
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user1);
        uint256 invoiceId2 = invoice.createInvoice(companyId1, 12346, client2, 2 ether);
        
        uint256[] memory invoiceIds = invoice.getInvoiceIdsByCompany(companyId1);
        assertEq(invoiceIds.length, 2);
        assertEq(invoiceIds[0], invoiceId1);
        assertEq(invoiceIds[1], invoiceId2);
    }

    function testGetInvoiceIdsByClient() public {
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user2);
        uint256 invoiceId2 = invoice.createInvoice(companyId2, 67890, client1, 2 ether);
        
        uint256[] memory invoiceIds = invoice.getInvoiceIdsByClient(client1);
        assertEq(invoiceIds.length, 2);
        assertEq(invoiceIds[0], invoiceId1);
        assertEq(invoiceIds[1], invoiceId2);
    }

    function testGetAllInvoiceIds() public {
        vm.prank(user1);
        uint256 invoiceId1 = invoice.createInvoice(companyId1, 12345, client1, 1 ether);
        
        vm.prank(user2);
        uint256 invoiceId2 = invoice.createInvoice(companyId2, 67890, client2, 2 ether);
        
        uint256[] memory allIds = invoice.getAllInvoiceIds();
        assertEq(allIds.length, 2);
        assertEq(allIds[0], invoiceId1);
        assertEq(allIds[1], invoiceId2);
    }

    function testUpdateCompanyContract() public {
        Company newCompany = new Company(owner);
        
        invoice.updateCompanyContract(address(newCompany));
        assertEq(address(invoice.companyContract()), address(newCompany));
    }

    function testUpdateCompanyContractNotOwner() public {
        Company newCompany = new Company(owner);
        
        vm.prank(user1);
        vm.expectRevert();
        invoice.updateCompanyContract(address(newCompany));
    }

    function testUpdateCompanyContractInvalidAddress() public {
        vm.expectRevert("Invoice: Invalid company contract address");
        invoice.updateCompanyContract(address(0));
    }

    function testFuzzCreateInvoice(uint256 number, uint256 totalAmount) public {
        vm.assume(totalAmount > 0);
        vm.assume(totalAmount <= 1000 ether);
        
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, number, client1, totalAmount);
        
        assertTrue(invoiceId > 0);
        assertTrue(invoice.invoiceExists(invoiceId));
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.number, number);
        assertEq(invoiceData.totalAmount, totalAmount);
        assertEq(invoiceData.clientAddress, client1);
        assertEq(invoiceData.companyId, companyId1);
        assertFalse(invoiceData.isPaid);
    }

    function testFuzzUpdateInvoice(uint256 originalAmount, uint256 newAmount) public {
        vm.assume(originalAmount > 0 && originalAmount <= 1000 ether);
        vm.assume(newAmount > 0 && newAmount <= 1000 ether);
        
        // Create invoice
        vm.prank(user1);
        uint256 invoiceId = invoice.createInvoice(companyId1, 12345, client1, originalAmount);
        
        // Update invoice
        vm.prank(user1);
        invoice.updateInvoice(invoiceId, newAmount);
        
        IInvoice.InvoiceData memory invoiceData = invoice.getInvoice(invoiceId);
        assertEq(invoiceData.totalAmount, newAmount);
    }
}
