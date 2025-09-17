// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/Clients.sol";
import "../src/contracts/Company.sol";

/**
 * @title ClientsTest
 * @dev Comprehensive test suite for Clients contract
 */
contract ClientsTest is Test {
    Clients public clients;
    Company public company;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public client1;
    address public client2;
    address public client3;
    
    uint256 public companyId1;
    uint256 public companyId2;
    
    event ClientRegistered(address indexed clientAddress, uint256 indexed companyId);
    event ClientPurchase(address indexed clientAddress, uint256 indexed companyId, uint256 amount);
    event ClientDeactivated(address indexed clientAddress, uint256 indexed companyId);
    event ClientReactivated(address indexed clientAddress, uint256 indexed companyId);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        client1 = makeAddr("client1");
        client2 = makeAddr("client2");
        client3 = makeAddr("client3");
        
        company = new Company(owner);
        clients = new Clients(owner, address(company));
        
        // Create companies
        vm.prank(user1);
        companyId1 = company.createCompany("Tech Solutions Inc");
        
        vm.prank(user2);
        companyId2 = company.createCompany("Digital Services LLC");
    }

    function testInitialState() public {
        assertEq(clients.getClientCountByCompany(companyId1), 0);
        assertEq(clients.owner(), owner);
        assertEq(address(clients.companyContract()), address(company));
    }

    function testRegisterClientPurchase() public {
        uint256 purchaseAmount = 1 ether;
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ClientRegistered(client1, companyId1);
        vm.expectEmit(true, true, false, true);
        emit ClientPurchase(client1, companyId1, purchaseAmount);
        clients.registerClientPurchase(companyId1, client1, purchaseAmount);
        
        assertEq(clients.getClientCountByCompany(companyId1), 1);
        assertTrue(clients.clientExists(companyId1, client1));
        assertTrue(clients.isClientActive(companyId1, client1));
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertEq(clientData.clientAddress, client1);
        assertEq(clientData.companyId, companyId1);
        assertEq(clientData.totalPurchases, 1);
        assertEq(clientData.totalSpent, purchaseAmount);
        assertEq(clientData.invoiceCount, 0);
        assertTrue(clientData.isActive);
        assertTrue(clientData.createdAt > 0);
        assertEq(clientData.updatedAt, clientData.createdAt);
    }

    function testRegisterClientPurchaseExistingClient() public {
        // Register client first time
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        // Register second purchase
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ClientPurchase(client1, companyId1, 2 ether);
        clients.registerClientPurchase(companyId1, client1, 2 ether);
        
        assertEq(clients.getClientCountByCompany(companyId1), 1); // Still 1 client
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertEq(clientData.totalPurchases, 2);
        assertEq(clientData.totalSpent, 3 ether);
        assertTrue(clientData.updatedAt > clientData.createdAt);
    }

    function testRegisterClientPurchaseCompanyDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Clients: Company does not exist");
        clients.registerClientPurchase(999, client1, 1 ether);
    }

    function testRegisterClientPurchaseCompanyNotActive() public {
        // Deactivate company
        vm.prank(user1);
        company.deactivateCompany(companyId1);
        
        vm.prank(user1);
        vm.expectRevert("Clients: Company is not active");
        clients.registerClientPurchase(companyId1, client1, 1 ether);
    }

    function testRegisterClientPurchaseNotCompanyOwner() public {
        vm.prank(user3);
        vm.expectRevert("Clients: Not authorized to register purchase");
        clients.registerClientPurchase(companyId1, client1, 1 ether);
    }

    function testRegisterClientPurchaseInvalidClientAddress() public {
        vm.prank(user1);
        vm.expectRevert("Clients: Invalid client address");
        clients.registerClientPurchase(companyId1, address(0), 1 ether);
    }

    function testRegisterClientPurchaseZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Clients: Purchase amount must be greater than zero");
        clients.registerClientPurchase(companyId1, client1, 0);
    }

    function testDeactivateClient() public {
        // Register client first
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ClientDeactivated(client1, companyId1);
        clients.deactivateClient(companyId1, client1);
        
        assertFalse(clients.isClientActive(companyId1, client1));
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertFalse(clientData.isActive);
        assertTrue(clientData.updatedAt > clientData.createdAt);
    }

    function testDeactivateClientDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Clients: Client does not exist");
        clients.deactivateClient(companyId1, client1);
    }

    function testDeactivateClientAlreadyDeactivated() public {
        // Register and deactivate client
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.deactivateClient(companyId1, client1);
        
        vm.prank(user1);
        vm.expectRevert("Clients: Client already deactivated");
        clients.deactivateClient(companyId1, client1);
    }

    function testReactivateClient() public {
        // Register and deactivate client
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.deactivateClient(companyId1, client1);
        
        // Advance time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ClientReactivated(client1, companyId1);
        clients.reactivateClient(companyId1, client1);
        
        assertTrue(clients.isClientActive(companyId1, client1));
    }

    function testReactivateClientAlreadyActive() public {
        // Register client
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        vm.expectRevert("Clients: Client already active");
        clients.reactivateClient(companyId1, client1);
    }

    function testGetClientsByCompany() public {
        // Register clients for company1
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 2 ether);
        
        // Register client for company2
        vm.prank(user2);
        clients.registerClientPurchase(companyId2, client3, 3 ether);
        
        IClients.ClientData[] memory company1Clients = clients.getClientsByCompany(companyId1);
        assertEq(company1Clients.length, 2);
        assertEq(company1Clients[0].clientAddress, client1);
        assertEq(company1Clients[1].clientAddress, client2);
        
        IClients.ClientData[] memory company2Clients = clients.getClientsByCompany(companyId2);
        assertEq(company2Clients.length, 1);
        assertEq(company2Clients[0].clientAddress, client3);
    }

    function testGetActiveClientsByCompany() public {
        // Register clients
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 2 ether);
        
        // Deactivate one client
        vm.prank(user1);
        clients.deactivateClient(companyId1, client2);
        
        IClients.ClientData[] memory activeClients = clients.getActiveClientsByCompany(companyId1);
        assertEq(activeClients.length, 1);
        assertEq(activeClients[0].clientAddress, client1);
    }

    function testGetClientsWithFilter() public {
        // Register clients with different spending amounts
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 5 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client3, 10 ether);
        
        // Deactivate one client
        vm.prank(user1);
        clients.deactivateClient(companyId1, client3);
        
        // Filter by spending range
        IClients.ClientFilter memory filter = IClients.ClientFilter({
            companyId: companyId1,
            minTotalSpent: 2 ether,
            maxTotalSpent: 8 ether,
            minPurchases: 0,
            maxPurchases: 0,
            isActive: true
        });
        
        IClients.ClientData[] memory filteredClients = clients.getClientsWithFilter(filter);
        assertEq(filteredClients.length, 1);
        assertEq(filteredClients[0].clientAddress, client2);
        assertEq(filteredClients[0].totalSpent, 5 ether);
    }

    function testGetClientStatsByCompany() public {
        // Register clients with purchases
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 2 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client3, 3 ether);
        
        // Make additional purchases
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether); // Total: 2 ether, 2 purchases
        
        // Deactivate one client
        vm.prank(user1);
        clients.deactivateClient(companyId1, client3);
        
        IClients.ClientStats memory stats = clients.getClientStatsByCompany(companyId1);
        
        assertEq(stats.totalClients, 3);
        assertEq(stats.activeClients, 2);
        assertEq(stats.inactiveClients, 1);
        assertEq(stats.totalSpent, 7 ether); // 1 + 1 + 2 + 3 = 7
        assertEq(stats.totalPurchases, 4); // 2 + 1 + 1 = 4
        assertEq(stats.averageSpentPerClient, 2333333333333333333); // 7 ether / 3 clients
    }

    function testGetClientCompanies() public {
        // Register client with multiple companies
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user2);
        clients.registerClientPurchase(companyId2, client1, 2 ether);
        
        uint256[] memory companyIds = clients.getClientCompanies(client1);
        assertEq(companyIds.length, 2);
        assertEq(companyIds[0], companyId1);
        assertEq(companyIds[1], companyId2);
    }

    function testGetClientAddressesByCompany() public {
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 2 ether);
        
        address[] memory clientAddresses = clients.getClientAddressesByCompany(companyId1);
        assertEq(clientAddresses.length, 2);
        assertEq(clientAddresses[0], client1);
        assertEq(clientAddresses[1], client2);
    }

    function testIncrementInvoiceCount() public {
        // Register client first
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        // Authorize the test contract to increment invoice count
        clients.authorizeContract(address(this));
        
        // Increment invoice count
        clients.incrementInvoiceCount(companyId1, client1);
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertEq(clientData.invoiceCount, 1);
    }

    function testIncrementInvoiceCountClientDoesNotExist() public {
        vm.expectRevert("Clients: Client does not exist");
        clients.incrementInvoiceCount(companyId1, client1);
    }

    function testUpdateCompanyContract() public {
        Company newCompany = new Company(owner);
        
        clients.updateCompanyContract(address(newCompany));
        assertEq(address(clients.companyContract()), address(newCompany));
    }

    function testUpdateCompanyContractNotOwner() public {
        Company newCompany = new Company(owner);
        
        vm.prank(user1);
        vm.expectRevert();
        clients.updateCompanyContract(address(newCompany));
    }

    function testUpdateCompanyContractInvalidAddress() public {
        vm.expectRevert("Clients: Invalid company contract address");
        clients.updateCompanyContract(address(0));
    }

    function testFuzzRegisterClientPurchase(uint256 purchaseAmount) public {
        vm.assume(purchaseAmount > 0);
        vm.assume(purchaseAmount <= 1000 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, purchaseAmount);
        
        assertTrue(clients.clientExists(companyId1, client1));
        assertTrue(clients.isClientActive(companyId1, client1));
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertEq(clientData.totalPurchases, 1);
        assertEq(clientData.totalSpent, purchaseAmount);
        assertEq(clientData.companyId, companyId1);
        assertEq(clientData.clientAddress, client1);
        assertTrue(clientData.isActive);
    }

    function testFuzzMultiplePurchases(uint256 purchase1, uint256 purchase2, uint256 purchase3) public {
        vm.assume(purchase1 > 0 && purchase1 <= 100 ether);
        vm.assume(purchase2 > 0 && purchase2 <= 100 ether);
        vm.assume(purchase3 > 0 && purchase3 <= 100 ether);
        
        // Register multiple purchases for same client
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, purchase1);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, purchase2);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, purchase3);
        
        IClients.ClientData memory clientData = clients.getClient(companyId1, client1);
        assertEq(clientData.totalPurchases, 3);
        assertEq(clientData.totalSpent, purchase1 + purchase2 + purchase3);
    }

    function testComplexClientManagement() public {
        // Register multiple clients with different patterns
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 1 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 5 ether);
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client3, 10 ether);
        
        // Additional purchases
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client1, 2 ether); // Total: 3 ether, 2 purchases
        
        vm.prank(user1);
        clients.registerClientPurchase(companyId1, client2, 3 ether); // Total: 8 ether, 2 purchases
        
        // Deactivate one client
        vm.prank(user1);
        clients.deactivateClient(companyId1, client3);
        
        // Test statistics
        IClients.ClientStats memory stats = clients.getClientStatsByCompany(companyId1);
        assertEq(stats.totalClients, 3);
        assertEq(stats.activeClients, 2);
        assertEq(stats.inactiveClients, 1);
        assertEq(stats.totalSpent, 21 ether); // 3 + 8 + 10
        assertEq(stats.totalPurchases, 5); // 2 + 2 + 1
        assertEq(stats.averageSpentPerClient, 7 ether); // 21 / 3
        
        // Test filtering
        IClients.ClientFilter memory filter = IClients.ClientFilter({
            companyId: companyId1,
            minTotalSpent: 5 ether,
            maxTotalSpent: 15 ether,
            minPurchases: 2,
            maxPurchases: 0,
            isActive: true
        });
        
        IClients.ClientData[] memory filteredClients = clients.getClientsWithFilter(filter);
        assertEq(filteredClients.length, 1);
        assertEq(filteredClients[0].clientAddress, client2);
        assertEq(filteredClients[0].totalSpent, 8 ether);
        assertEq(filteredClients[0].totalPurchases, 2);
    }
}
