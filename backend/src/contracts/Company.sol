// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/ICompany.sol";

/**
 * @title Company
 * @dev Contract for managing companies in the e-commerce platform
 * @notice This contract allows creation, updating, and management of companies
 * @author E-commerce Platform Team
 */
contract Company is Ownable, ICompany {
    // Mapping from company ID to company data
    mapping(uint256 => CompanyData) private companies;
    
    // Mapping from owner address to array of company IDs
    mapping(address => uint256[]) private ownerCompanies;
    
    // Array of all company IDs
    uint256[] private allCompanyIds;
    
    // Counter for generating unique company IDs
    uint256 private companyCounter = 0;
    
    // Events are inherited from ICompany interface

    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Create a new company
     * @param name Name of the company
     * @return companyId Unique identifier for the created company
     */
    function createCompany(string memory name) external override returns (uint256 companyId) {
        require(bytes(name).length > 0, "Company: Name cannot be empty");
        require(bytes(name).length <= 100, "Company: Name too long");
        
        companyCounter++;
        companyId = companyCounter;
        
        companies[companyId] = CompanyData({
            owner: msg.sender,
            name: name,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        ownerCompanies[msg.sender].push(companyId);
        allCompanyIds.push(companyId);
        
        emit CompanyCreated(companyId, msg.sender, name);
        
        return companyId;
    }

    /**
     * @dev Update company information
     * @param companyId Unique identifier for the company
     * @param name New name of the company
     */
    function updateCompany(uint256 companyId, string memory name) external override {
        require(companyExists(companyId), "Company: Company does not exist");
        require(companies[companyId].owner == msg.sender, "Company: Not the company owner");
        require(bytes(name).length > 0, "Company: Name cannot be empty");
        require(bytes(name).length <= 100, "Company: Name too long");
        
        companies[companyId].name = name;
        companies[companyId].updatedAt = block.timestamp;
        
        emit CompanyUpdated(companyId, name);
    }

    /**
     * @dev Deactivate a company
     * @param companyId Unique identifier for the company
     */
    function deactivateCompany(uint256 companyId) external override {
        require(companyExists(companyId), "Company: Company does not exist");
        require(companies[companyId].owner == msg.sender, "Company: Not the company owner");
        require(companies[companyId].isActive, "Company: Company already deactivated");
        
        companies[companyId].isActive = false;
        companies[companyId].updatedAt = block.timestamp;
        
        emit CompanyDeactivated(companyId);
    }

    /**
     * @dev Reactivate a company
     * @param companyId Unique identifier for the company
     */
    function reactivateCompany(uint256 companyId) external override {
        require(companyExists(companyId), "Company: Company does not exist");
        require(companies[companyId].owner == msg.sender, "Company: Not the company owner");
        require(!companies[companyId].isActive, "Company: Company already active");
        
        companies[companyId].isActive = true;
        companies[companyId].updatedAt = block.timestamp;
        
        emit CompanyReactivated(companyId);
    }

    /**
     * @dev Get company information
     * @param companyId Unique identifier for the company
     * @return company Company data structure
     */
    function getCompany(uint256 companyId) external view override returns (CompanyData memory company) {
        require(companyExists(companyId), "Company: Company does not exist");
        return companies[companyId];
    }

    /**
     * @dev Get all companies
     * @return companiesArray Array of all companies
     */
    function getAllCompanies() external view override returns (CompanyData[] memory companiesArray) {
        companiesArray = new CompanyData[](allCompanyIds.length);
        for (uint256 i = 0; i < allCompanyIds.length; i++) {
            companiesArray[i] = companies[allCompanyIds[i]];
        }
        return companiesArray;
    }

    /**
     * @dev Get companies by owner
     * @param owner Address of the company owner
     * @return companiesArray Array of companies owned by the address
     */
    function getCompaniesByOwner(address owner) external view override returns (CompanyData[] memory companiesArray) {
        require(owner != address(0), "Company: Invalid owner address");
        
        uint256[] memory ownerCompanyIds = ownerCompanies[owner];
        companiesArray = new CompanyData[](ownerCompanyIds.length);
        
        for (uint256 i = 0; i < ownerCompanyIds.length; i++) {
            companiesArray[i] = companies[ownerCompanyIds[i]];
        }
        
        return companiesArray;
    }

    /**
     * @dev Get active companies
     * @return companiesArray Array of active companies
     */
    function getActiveCompanies() external view override returns (CompanyData[] memory companiesArray) {
        uint256 activeCount = 0;
        
        // Count active companies
        for (uint256 i = 0; i < allCompanyIds.length; i++) {
            if (companies[allCompanyIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array with active companies
        companiesArray = new CompanyData[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCompanyIds.length; i++) {
            if (companies[allCompanyIds[i]].isActive) {
                companiesArray[index] = companies[allCompanyIds[i]];
                index++;
            }
        }
        
        return companiesArray;
    }

    /**
     * @dev Check if a company exists
     * @param companyId Unique identifier for the company
     * @return exists True if company exists, false otherwise
     */
    function companyExists(uint256 companyId) public view override returns (bool exists) {
        return companyId > 0 && companyId <= companyCounter;
    }

    /**
     * @dev Check if a company is active
     * @param companyId Unique identifier for the company
     * @return isActive True if company is active, false otherwise
     */
    function isCompanyActive(uint256 companyId) external view override returns (bool isActive) {
        require(companyExists(companyId), "Company: Company does not exist");
        return companies[companyId].isActive;
    }

    /**
     * @dev Get total number of companies
     * @return count Total number of companies
     */
    function getCompanyCount() external view override returns (uint256 count) {
        return allCompanyIds.length;
    }

    /**
     * @dev Get company IDs by owner
     * @param owner Address of the company owner
     * @return companyIds Array of company IDs owned by the address
     */
    function getCompanyIdsByOwner(address owner) external view returns (uint256[] memory companyIds) {
        require(owner != address(0), "Company: Invalid owner address");
        return ownerCompanies[owner];
    }

    /**
     * @dev Get all company IDs
     * @return companyIds Array of all company IDs
     */
    function getAllCompanyIds() external view returns (uint256[] memory companyIds) {
        return allCompanyIds;
    }

    /**
     * @dev Get companies by ID range
     * @param startId Starting company ID (inclusive)
     * @param endId Ending company ID (inclusive)
     * @return companiesArray Array of companies in the specified range
     */
    function getCompaniesByIdRange(uint256 startId, uint256 endId) external view returns (CompanyData[] memory companiesArray) {
        require(startId <= endId, "Company: Invalid range");
        require(startId > 0, "Company: Start ID must be greater than 0");
        
        uint256 count = 0;
        for (uint256 i = startId; i <= endId && i <= companyCounter; i++) {
            if (companyExists(i)) {
                count++;
            }
        }
        
        companiesArray = new CompanyData[](count);
        uint256 index = 0;
        
        for (uint256 i = startId; i <= endId && i <= companyCounter; i++) {
            if (companyExists(i)) {
                companiesArray[index] = companies[i];
                index++;
            }
        }
        
        return companiesArray;
    }

    /**
     * @dev Transfer company ownership (only owner)
     * @param companyId Unique identifier for the company
     * @param newOwner Address of the new owner
     */
    function transferCompanyOwnership(uint256 companyId, address newOwner) external onlyOwner {
        require(companyExists(companyId), "Company: Company does not exist");
        require(newOwner != address(0), "Company: Invalid new owner address");
        require(newOwner != companies[companyId].owner, "Company: New owner same as current owner");
        
        address oldOwner = companies[companyId].owner;
        companies[companyId].owner = newOwner;
        companies[companyId].updatedAt = block.timestamp;
        
        // Remove from old owner's list
        uint256[] storage oldOwnerCompanies = ownerCompanies[oldOwner];
        for (uint256 i = 0; i < oldOwnerCompanies.length; i++) {
            if (oldOwnerCompanies[i] == companyId) {
                oldOwnerCompanies[i] = oldOwnerCompanies[oldOwnerCompanies.length - 1];
                oldOwnerCompanies.pop();
                break;
            }
        }
        
        // Add to new owner's list
        ownerCompanies[newOwner].push(companyId);
    }
}
