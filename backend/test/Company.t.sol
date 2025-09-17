// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/Company.sol";

/**
 * @title CompanyTest
 * @dev Comprehensive test suite for Company contract
 */
contract CompanyTest is Test {
    Company public company;
    address public owner;
    address public user1;
    address public user2;
    
    event CompanyCreated(uint256 indexed companyId, address indexed owner, string name);
    event CompanyUpdated(uint256 indexed companyId, string name);
    event CompanyDeactivated(uint256 indexed companyId);
    event CompanyReactivated(uint256 indexed companyId);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        company = new Company(owner);
    }

    function testInitialState() public {
        assertEq(company.getCompanyCount(), 0);
        assertEq(company.owner(), owner);
    }

    function testCreateCompany() public {
        string memory name = "Test Company";
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit CompanyCreated(1, user1, name);
        uint256 companyId = company.createCompany(name);
        
        assertEq(companyId, 1);
        assertEq(company.getCompanyCount(), 1);
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertEq(companyData.owner, user1);
        assertEq(companyData.name, name);
        assertTrue(companyData.isActive);
        assertTrue(companyData.createdAt > 0);
        assertEq(companyData.updatedAt, companyData.createdAt);
    }

    function testCreateCompanyEmptyName() public {
        vm.prank(user1);
        vm.expectRevert("Company: Name cannot be empty");
        company.createCompany("");
    }

    function testCreateCompanyNameTooLong() public {
        string memory longName = "This is a very long company name that exceeds the maximum allowed length of 100 characters and should cause the transaction to revert";
        
        vm.prank(user1);
        vm.expectRevert("Company: Name too long");
        company.createCompany(longName);
    }

    function testUpdateCompany() public {
        // Create a company first
        vm.prank(user1);
        uint256 companyId = company.createCompany("Original Name");
        
        // Warp time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        string memory newName = "Updated Name";
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit CompanyUpdated(companyId, newName);
        company.updateCompany(companyId, newName);
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertEq(companyData.name, newName);
        assertTrue(companyData.updatedAt > companyData.createdAt);
    }

    function testUpdateCompanyNotOwner() public {
        // Create a company first
        vm.prank(user1);
        uint256 companyId = company.createCompany("Original Name");
        
        vm.prank(user2);
        vm.expectRevert("Company: Not the company owner");
        company.updateCompany(companyId, "New Name");
    }

    function testUpdateCompanyDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("Company: Company does not exist");
        company.updateCompany(999, "New Name");
    }

    function testUpdateCompanyEmptyName() public {
        // Create a company first
        vm.prank(user1);
        uint256 companyId = company.createCompany("Original Name");
        
        vm.prank(user1);
        vm.expectRevert("Company: Name cannot be empty");
        company.updateCompany(companyId, "");
    }

    function testDeactivateCompany() public {
        // Create a company first
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        // Warp time to ensure updatedAt > createdAt
        vm.warp(block.timestamp + 1);
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit CompanyDeactivated(companyId);
        company.deactivateCompany(companyId);
        
        assertFalse(company.isCompanyActive(companyId));
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertFalse(companyData.isActive);
        assertTrue(companyData.updatedAt > companyData.createdAt);
    }

    function testDeactivateCompanyNotOwner() public {
        // Create a company first
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.prank(user2);
        vm.expectRevert("Company: Not the company owner");
        company.deactivateCompany(companyId);
    }

    function testDeactivateCompanyAlreadyDeactivated() public {
        // Create and deactivate a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.prank(user1);
        company.deactivateCompany(companyId);
        
        vm.prank(user1);
        vm.expectRevert("Company: Company already deactivated");
        company.deactivateCompany(companyId);
    }

    function testReactivateCompany() public {
        // Create and deactivate a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.prank(user1);
        company.deactivateCompany(companyId);
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, false);
        emit CompanyReactivated(companyId);
        company.reactivateCompany(companyId);
        
        assertTrue(company.isCompanyActive(companyId));
    }

    function testReactivateCompanyNotOwner() public {
        // Create and deactivate a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.prank(user1);
        company.deactivateCompany(companyId);
        
        vm.prank(user2);
        vm.expectRevert("Company: Not the company owner");
        company.reactivateCompany(companyId);
    }

    function testReactivateCompanyAlreadyActive() public {
        // Create a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.prank(user1);
        vm.expectRevert("Company: Company already active");
        company.reactivateCompany(companyId);
    }

    function testGetAllCompanies() public {
        // Create multiple companies
        vm.prank(user1);
        company.createCompany("Company 1");
        
        vm.prank(user2);
        company.createCompany("Company 2");
        
        ICompany.CompanyData[] memory companies = company.getAllCompanies();
        assertEq(companies.length, 2);
        assertEq(companies[0].name, "Company 1");
        assertEq(companies[1].name, "Company 2");
    }

    function testGetCompaniesByOwner() public {
        // Create companies for different owners
        vm.prank(user1);
        company.createCompany("User1 Company 1");
        
        vm.prank(user1);
        company.createCompany("User1 Company 2");
        
        vm.prank(user2);
        company.createCompany("User2 Company 1");
        
        ICompany.CompanyData[] memory user1Companies = company.getCompaniesByOwner(user1);
        assertEq(user1Companies.length, 2);
        assertEq(user1Companies[0].name, "User1 Company 1");
        assertEq(user1Companies[1].name, "User1 Company 2");
        
        ICompany.CompanyData[] memory user2Companies = company.getCompaniesByOwner(user2);
        assertEq(user2Companies.length, 1);
        assertEq(user2Companies[0].name, "User2 Company 1");
    }

    function testGetActiveCompanies() public {
        // Create companies and deactivate one
        vm.prank(user1);
        uint256 companyId1 = company.createCompany("Active Company");
        
        vm.prank(user2);
        uint256 companyId2 = company.createCompany("Inactive Company");
        
        vm.prank(user2);
        company.deactivateCompany(companyId2);
        
        ICompany.CompanyData[] memory activeCompanies = company.getActiveCompanies();
        assertEq(activeCompanies.length, 1);
        assertEq(activeCompanies[0].name, "Active Company");
    }

    function testCompanyExists() public {
        assertFalse(company.companyExists(0));
        assertFalse(company.companyExists(1));
        
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        assertTrue(company.companyExists(companyId));
        assertFalse(company.companyExists(companyId + 1));
    }

    function testGetCompanyIdsByOwner() public {
        vm.prank(user1);
        uint256 companyId1 = company.createCompany("Company 1");
        
        vm.prank(user1);
        uint256 companyId2 = company.createCompany("Company 2");
        
        uint256[] memory companyIds = company.getCompanyIdsByOwner(user1);
        assertEq(companyIds.length, 2);
        assertEq(companyIds[0], companyId1);
        assertEq(companyIds[1], companyId2);
    }

    function testGetAllCompanyIds() public {
        vm.prank(user1);
        uint256 companyId1 = company.createCompany("Company 1");
        
        vm.prank(user2);
        uint256 companyId2 = company.createCompany("Company 2");
        
        uint256[] memory allIds = company.getAllCompanyIds();
        assertEq(allIds.length, 2);
        assertEq(allIds[0], companyId1);
        assertEq(allIds[1], companyId2);
    }

    function testGetCompaniesByIdRange() public {
        vm.prank(user1);
        uint256 companyId1 = company.createCompany("Company 1");
        
        vm.prank(user2);
        uint256 companyId2 = company.createCompany("Company 2");
        
        ICompany.CompanyData[] memory companies = company.getCompaniesByIdRange(1, 2);
        assertEq(companies.length, 2);
        assertEq(companies[0].name, "Company 1");
        assertEq(companies[1].name, "Company 2");
    }

    function testTransferCompanyOwnership() public {
        // Create a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        // Transfer ownership
        company.transferCompanyOwnership(companyId, user2);
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertEq(companyData.owner, user2);
        
        // Check that user1 can no longer update the company
        vm.prank(user1);
        vm.expectRevert("Company: Not the company owner");
        company.updateCompany(companyId, "New Name");
        
        // Check that user2 can now update the company
        vm.prank(user2);
        company.updateCompany(companyId, "New Name");
        
        companyData = company.getCompany(companyId);
        assertEq(companyData.name, "New Name");
    }

    function testTransferCompanyOwnershipNotOwner() public {
        // Create a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        // Try to transfer ownership as non-owner
        vm.prank(user1);
        vm.expectRevert();
        company.transferCompanyOwnership(companyId, user2);
    }

    function testTransferCompanyOwnershipInvalidNewOwner() public {
        // Create a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.expectRevert("Company: Invalid new owner address");
        company.transferCompanyOwnership(companyId, address(0));
    }

    function testTransferCompanyOwnershipSameOwner() public {
        // Create a company
        vm.prank(user1);
        uint256 companyId = company.createCompany("Test Company");
        
        vm.expectRevert("Company: New owner same as current owner");
        company.transferCompanyOwnership(companyId, user1);
    }

    function testFuzzCreateCompany(string memory name) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(bytes(name).length <= 100);
        
        vm.prank(user1);
        uint256 companyId = company.createCompany(name);
        
        assertTrue(companyId > 0);
        assertTrue(company.companyExists(companyId));
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertEq(companyData.name, name);
        assertEq(companyData.owner, user1);
        assertTrue(companyData.isActive);
    }

    function testFuzzUpdateCompany(string memory originalName, string memory newName) public {
        vm.assume(bytes(originalName).length > 0);
        vm.assume(bytes(originalName).length <= 100);
        vm.assume(bytes(newName).length > 0);
        vm.assume(bytes(newName).length <= 100);
        
        // Create company
        vm.prank(user1);
        uint256 companyId = company.createCompany(originalName);
        
        // Update company
        vm.prank(user1);
        company.updateCompany(companyId, newName);
        
        ICompany.CompanyData memory companyData = company.getCompany(companyId);
        assertEq(companyData.name, newName);
    }
}
