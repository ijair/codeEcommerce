// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICompany
 * @dev Interface for Company contract
 * @notice This interface defines the structure and functions for managing companies
 */
interface ICompany {
    /**
     * @dev Company structure
     * @param owner Address of the company owner
     * @param name Name of the company
     * @param isActive Whether the company is active
     * @param createdAt Timestamp when the company was created
     * @param updatedAt Timestamp when the company was last updated
     */
    struct CompanyData {
        address owner;
        string name;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    /**
     * @dev Emitted when a new company is created
     * @param companyId Unique identifier for the company
     * @param owner Address of the company owner
     * @param name Name of the company
     */
    event CompanyCreated(uint256 indexed companyId, address indexed owner, string name);

    /**
     * @dev Emitted when a company is updated
     * @param companyId Unique identifier for the company
     * @param name New name of the company
     */
    event CompanyUpdated(uint256 indexed companyId, string name);

    /**
     * @dev Emitted when a company is deactivated
     * @param companyId Unique identifier for the company
     */
    event CompanyDeactivated(uint256 indexed companyId);

    /**
     * @dev Emitted when a company is reactivated
     * @param companyId Unique identifier for the company
     */
    event CompanyReactivated(uint256 indexed companyId);

    /**
     * @dev Create a new company
     * @param name Name of the company
     * @return companyId Unique identifier for the created company
     */
    function createCompany(string memory name) external returns (uint256 companyId);

    /**
     * @dev Update company information
     * @param companyId Unique identifier for the company
     * @param name New name of the company
     */
    function updateCompany(uint256 companyId, string memory name) external;

    /**
     * @dev Deactivate a company
     * @param companyId Unique identifier for the company
     */
    function deactivateCompany(uint256 companyId) external;

    /**
     * @dev Reactivate a company
     * @param companyId Unique identifier for the company
     */
    function reactivateCompany(uint256 companyId) external;

    /**
     * @dev Get company information
     * @param companyId Unique identifier for the company
     * @return company Company data structure
     */
    function getCompany(uint256 companyId) external view returns (CompanyData memory company);

    /**
     * @dev Get all companies
     * @return companies Array of all companies
     */
    function getAllCompanies() external view returns (CompanyData[] memory companies);

    /**
     * @dev Get companies by owner
     * @param owner Address of the company owner
     * @return companies Array of companies owned by the address
     */
    function getCompaniesByOwner(address owner) external view returns (CompanyData[] memory companies);

    /**
     * @dev Get active companies
     * @return companies Array of active companies
     */
    function getActiveCompanies() external view returns (CompanyData[] memory companies);

    /**
     * @dev Check if a company exists
     * @param companyId Unique identifier for the company
     * @return exists True if company exists, false otherwise
     */
    function companyExists(uint256 companyId) external view returns (bool exists);

    /**
     * @dev Check if a company is active
     * @param companyId Unique identifier for the company
     * @return isActive True if company is active, false otherwise
     */
    function isCompanyActive(uint256 companyId) external view returns (bool isActive);

    /**
     * @dev Get total number of companies
     * @return count Total number of companies
     */
    function getCompanyCount() external view returns (uint256 count);
}
