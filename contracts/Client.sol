// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AuthorizedContract.sol";

/**
 * @title Client
 * @dev Contract representing a client in the e-commerce platform
 * Each Client is defined by company address, client address, and total purchases
 */
contract Client is AuthorizedContract, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    // Struct to represent a client
    struct ClientData {
        address companyAddress;
        address clientAddress;
        uint256 totalPurchases; // Total purchases in ECO tokens (with 18 decimals)
        uint256 totalInvoices;
        uint256 registrationDate;
        uint256 lastPurchaseDate;
        bool isActive;
    }
    
    // Mapping from company address to mapping of client address to client data
    mapping(address => mapping(address => ClientData)) public Clients;
    
    // Mapping from company address to array of client addresses
    mapping(address => address[]) public companyClients;
    
    // Mapping to check if a client is registered for a company
    mapping(address => mapping(address => bool)) public isClientRegistered;
    
    // Global client counter
    uint256 public globalClientCounter;
    
    // Events
    event ClientRegistered(
        address indexed companyAddress,
        address indexed clientAddress,
        uint256 registrationDate
    );
    event PurchaseUpdated(
        address indexed companyAddress,
        address indexed clientAddress,
        uint256 newTotalPurchases,
        uint256 purchaseDate
    );
    event ClientDeactivated(
        address indexed companyAddress,
        address indexed clientAddress
    );
    event ClientActivated(
        address indexed companyAddress,
        address indexed clientAddress
    );
    
    // Modifiers
    modifier onlyValidCompany(address companyAddress) {
        require(companyAddress != address(0), "Client: Invalid company address");
        _;
    }
    
    modifier onlyValidClient(address clientAddress) {
        require(clientAddress != address(0), "Client: Invalid client address");
        _;
    }
    
    modifier onlyRegisteredClient(address companyAddress, address clientAddress) {
        require(
            isClientRegistered[companyAddress][clientAddress],
            "Client: Client not registered for this company"
        );
        _;
    }
    
    
    /**
     * @dev Register a new client for an company
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     */
    function registerClient(
        address companyAddress,
        address clientAddress
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyAuthorized
        nonReentrant 
    {
        require(
            !isClientRegistered[companyAddress][clientAddress],
            "Client: Client already registered for this company"
        );
        
        ClientData memory newClient = ClientData({
            companyAddress: companyAddress,
            clientAddress: clientAddress,
            totalPurchases: 0,
            totalInvoices: 0,
            registrationDate: block.timestamp,
            lastPurchaseDate: 0,
            isActive: true
        });
        
        Clients[companyAddress][clientAddress] = newClient;
        companyClients[companyAddress].push(clientAddress);
        isClientRegistered[companyAddress][clientAddress] = true;
        globalClientCounter++;
        
        emit ClientRegistered(companyAddress, clientAddress, block.timestamp);
    }
    
    /**
     * @dev Update client's total purchases (called by e-commerce contract)
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     * @param purchaseAmount Amount of the purchase in ECO tokens
     */
    function updatePurchases(
        address companyAddress,
        address clientAddress,
        uint256 purchaseAmount
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredClient(companyAddress, clientAddress) 
    {
        require(purchaseAmount > 0, "Client: Purchase amount must be greater than 0");
        
        ClientData storage clientData = Clients[companyAddress][clientAddress];
        clientData.totalPurchases += purchaseAmount;
        clientData.lastPurchaseDate = block.timestamp;
        clientData.totalInvoices++;
        
        emit PurchaseUpdated(companyAddress, clientAddress, clientData.totalPurchases, block.timestamp);
    }
    
    /**
     * @dev Deactivate a client
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     */
    function deactivateClient(
        address companyAddress,
        address clientAddress
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredClient(companyAddress, clientAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "Client: Only company owner or contract owner can deactivate"
        );
        
        Clients[companyAddress][clientAddress].isActive = false;
        
        emit ClientDeactivated(companyAddress, clientAddress);
    }
    
    /**
     * @dev Activate a client
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     */
    function activateClient(
        address companyAddress,
        address clientAddress
    ) 
        external 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredClient(companyAddress, clientAddress) 
    {
        require(
            msg.sender == companyAddress || msg.sender == owner(),
            "Client: Only company owner or contract owner can activate"
        );
        
        Clients[companyAddress][clientAddress].isActive = true;
        
        emit ClientActivated(companyAddress, clientAddress);
    }
    
    /**
     * @dev Get client data
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     * @return ClientData struct containing all client information
     */
    function getClientData(
        address companyAddress,
        address clientAddress
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredClient(companyAddress, clientAddress) 
        returns (ClientData memory) 
    {
        return Clients[companyAddress][clientAddress];
    }
    
    /**
     * @dev Get all client addresses for an company
     * @param companyAddress Address of the company
     * @return Array of client addresses
     */
    function getCompanyClients(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (address[] memory) 
    {
        return companyClients[companyAddress];
    }
    
    /**
     * @dev Get client count for an company
     * @param companyAddress Address of the company
     * @return Number of clients
     */
    function getClientCount(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256) 
    {
        return companyClients[companyAddress].length;
    }
    
    /**
     * @dev Get total revenue from all clients for an company
     * @param companyAddress Address of the company
     * @return Total revenue from all clients
     */
    function getTotalRevenueFromClients(address companyAddress) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (uint256) 
    {
        uint256 total = 0;
        address[] memory clientAddresses = companyClients[companyAddress];
        
        for (uint256 i = 0; i < clientAddresses.length; i++) {
            if (Clients[companyAddress][clientAddresses[i]].isActive) {
                total += Clients[companyAddress][clientAddresses[i]].totalPurchases;
            }
        }
        
        return total;
    }
    
    /**
     * @dev Check if a client is active
     * @param companyAddress Address of the company
     * @param clientAddress Address of the client
     * @return True if client is active, false otherwise
     */
    function isClientActive(
        address companyAddress,
        address clientAddress
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        onlyValidClient(clientAddress) 
        onlyRegisteredClient(companyAddress, clientAddress) 
        returns (bool) 
    {
        return Clients[companyAddress][clientAddress].isActive;
    }
    
    /**
     * @dev Get total number of clients across all companies
     * @return Total count of clients
     */
    function getTotalClients() external view returns (uint256) {
        return globalClientCounter;
    }
    
    /**
     * @dev Get top clients by purchase amount for an company
     * @param companyAddress Address of the company
     * @param limit Number of top clients to return
     * @return Array of client addresses sorted by purchase amount (descending)
     */
    function getTopClients(
        address companyAddress,
        uint256 limit
    ) 
        external 
        view 
        onlyValidCompany(companyAddress) 
        returns (address[] memory) 
    {
        address[] memory allClients = companyClients[companyAddress];
        uint256 clientCount = allClients.length;
        
        if (clientCount == 0) {
            return new address[](0);
        }
        
        // Limit the number of results
        uint256 resultCount = limit > clientCount ? clientCount : limit;
        address[] memory topClients = new address[](resultCount);
        
        // Simple selection sort by purchase amount
        for (uint256 i = 0; i < resultCount; i++) {
            uint256 maxIndex = i;
            for (uint256 j = i + 1; j < clientCount; j++) {
                if (
                    Clients[companyAddress][allClients[j]].totalPurchases > 
                    Clients[companyAddress][allClients[maxIndex]].totalPurchases
                ) {
                    maxIndex = j;
                }
            }
            
            if (maxIndex != i) {
                address temp = allClients[i];
                allClients[i] = allClients[maxIndex];
                allClients[maxIndex] = temp;
            }
            
            topClients[i] = allClients[i];
        }
        
        return topClients;
    }
    
}
