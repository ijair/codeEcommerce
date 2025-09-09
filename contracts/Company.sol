// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AuthorizedContract.sol";

/**
 * @title Company
 * @dev Contract representing a company in the e-commerce platform
 * Each Company is defined by an address and a name
 */
contract Company is AuthorizedContract, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    // Struct to represent a Company
    struct CompanyData {
        address companyAddress;
        string name;
        bool isActive;
        uint256 registrationDate;
        uint256 totalProducts;
        uint256 totalInvoices;
        uint256 totalRevenue;
    }
    
    // Mapping from Company address to Company data
    mapping(address => CompanyData) public companies;
    
    // Array to store all Company addresses
    address[] public companyAddresses;
    
    // Mapping to check if an address is already registered as Company
    mapping(address => bool) public isCompanyRegistered;
    
    // Events
    event CompanyRegistered(address indexed companyAddress, string name, uint256 registrationDate);
    event CompanyUpdated(address indexed companyAddress, string newName);
    event CompanyDeactivated(address indexed companyAddress);
    event CompanyActivated(address indexed companyAddress);
    event RevenueUpdated(address indexed companyAddress, uint256 newRevenue);
    
    // Modifiers
    modifier onlyRegisteredCompany() {
        require(isCompanyRegistered[msg.sender], "Company: Only registered Companies can call this");
        _;
    }
    
    modifier onlyValidCompany(address companyAddress) {
        require(isCompanyRegistered[companyAddress], "Company: Company not registered");
        _;
    }
    
    
    /**
     * @dev Register a new Company
     * @param companyAddress Address of the Company
     * @param name Name of the Company
     */
    function registerCompany(address companyAddress, string memory name) 
        external 
        onlyAuthorized 
        nonReentrant 
    {
        require(companyAddress != address(0), "Company: Invalid address");
        require(!isCompanyRegistered[companyAddress], "Company: Already registered");
        require(bytes(name).length > 0, "Company: Name cannot be empty");
        
        CompanyData memory newCompany = CompanyData({
            companyAddress: companyAddress,
            name: name,
            isActive: true,
            registrationDate: block.timestamp,
            totalProducts: 0,
            totalInvoices: 0,
            totalRevenue: 0
        });
        
        companies[companyAddress] = newCompany;
        companyAddresses.push(companyAddress);
        isCompanyRegistered[companyAddress] = true;
        
        emit CompanyRegistered(companyAddress, name, block.timestamp);
    }
    
    /**
     * @dev Update Company name (only by the Company itself or owner)
     * @param companyAddress Address of the Company
     * @param newName New name for the Company
     */
    function updateCompanyName(address companyAddress, string memory newName) 
        external 
        onlyValidCompany(companyAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "Company: Only Company owner or contract owner can update"
        );
        require(bytes(newName).length > 0, "Company: Name cannot be empty");
        
        companies[companyAddress].name = newName;
        
        emit CompanyUpdated(companyAddress, newName);
    }
    
    /**
     * @dev Deactivate a Company
     * @param companyAddress Address of the Company to deactivate
     */
    function deactivateCompany(address companyAddress) 
        external 
        onlyValidCompany(companyAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "Company: Only Company owner or contract owner can deactivate"
        );
        
        companies[companyAddress].isActive = false;
        
        emit CompanyDeactivated(companyAddress);
    }
    
    /**
     * @dev Activate a Company
     * @param companyAddress Address of the Company to activate
     */
    function activateCompany(address companyAddress) 
        external 
        onlyValidCompany(companyAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "Company: Only Company owner or contract owner can activate"
        );
        
        companies[companyAddress].isActive = true;
        
        emit CompanyActivated(companyAddress);
    }
    
    /**
     * @dev Update Company revenue (called by e-commerce contract)
     * @param companyAddress Address of the Company
     * @param additionalRevenue Additional revenue to add
     */
    function updateRevenue(address companyAddress, uint256 additionalRevenue) 
        external 
        onlyValidCompany(companyAddress) 
    {
        require(additionalRevenue > 0, "Company: Revenue must be greater than 0");
        
        companies[companyAddress].totalRevenue += additionalRevenue;
        
        emit RevenueUpdated(companyAddress, companies[companyAddress].totalRevenue);
    }
    
    /**
     * @dev Increment product count for a Company
     * @param companyAddress Address of the Company
     */
    function incrementProductCount(address companyAddress) 
        external 
        onlyValidCompany(companyAddress) 
    {
        companies[companyAddress].totalProducts++;
    }
    
    /**
     * @dev Increment invoice count for a Company
     * @param companyAddress Address of the Company
     */
    function incrementInvoiceCount(address companyAddress) 
        external 
        onlyValidCompany(companyAddress) 
    {
        companies[companyAddress].totalInvoices++;
    }
    
    /**
     * @dev Get Company data
     * @param companyAddress Address of the Company
     * @return CompanyData struct containing all Company information
     */
    function getCompanyData(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (CompanyData memory) 
    {
        return companies[companyAddress];
    }
    
    /**
     * @dev Get total number of registered Companies
     * @return Total count of Companies
     */
    function getTotalCompanies() external view returns (uint256) {
        return companyAddresses.length;
    }
    
    /**
     * @dev Get all Companies addresses
     * @return Array of all Companies addresses
     */
    function getAllCompaniesAddresses() external view returns (address[] memory) {
        return companyAddresses;
    }
    
    /**
     * @dev Check if a Company is active
     * @param companyAddress Address of the Company
     * @return True if Company is active, false otherwise
     */
    function isCompanyActive(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (bool) 
    {
        return companies[companyAddress].isActive;
    }
    
}
