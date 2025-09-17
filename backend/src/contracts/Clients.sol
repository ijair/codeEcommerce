// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IClients.sol";
import "../interfaces/ICompany.sol";

/**
 * @title Clients
 * @dev Contract for managing clients in the e-commerce platform
 * @notice This contract allows registration and management of clients with purchase tracking
 * @author E-commerce Platform Team
 */
contract Clients is Ownable, IClients {
    // Reference to the Company contract
    ICompany public companyContract;
    
    // Mapping of authorized contracts that can register purchases
    mapping(address => bool) public authorizedContracts;
    
    // Mapping from company ID => client address => client data
    mapping(uint256 => mapping(address => ClientData)) private clients;
    
    // Mapping from company ID to array of client addresses
    mapping(uint256 => address[]) private companyClients;
    
    // Mapping from client address to array of company IDs they've purchased from
    mapping(address => uint256[]) private clientCompanies;
    
    // Events are inherited from IClients interface

    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     * @param _companyContract Address of the Company contract
     */
    constructor(address initialOwner, address _companyContract) Ownable(initialOwner) {
        require(_companyContract != address(0), "Clients: Invalid company contract address");
        companyContract = ICompany(_companyContract);
    }

    /**
     * @dev Authorize a contract to register purchases (only owner)
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Clients: Invalid contract address");
        authorizedContracts[contractAddress] = true;
    }

    /**
     * @dev Revoke authorization from a contract (only owner)
     * @param contractAddress Address of the contract to revoke
     */
    function revokeContractAuthorization(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    /**
     * @dev Register a new client or update existing client's purchase
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @param purchaseAmount Amount of the purchase
     */
    function registerClientPurchase(
        uint256 companyId,
        address clientAddress,
        uint256 purchaseAmount
    ) external override {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        require(companyContract.isCompanyActive(companyId), "Clients: Company is not active");
        require(clientAddress != address(0), "Clients: Invalid client address");
        require(purchaseAmount > 0, "Clients: Purchase amount must be greater than zero");
        
        // Check if caller is the company owner OR an authorized contract
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(
            company.owner == msg.sender || authorizedContracts[msg.sender], 
            "Clients: Not authorized to register purchase"
        );
        
        bool isNewClient = !clientExists(companyId, clientAddress);
        
        if (isNewClient) {
            // Register new client
            clients[companyId][clientAddress] = ClientData({
                clientAddress: clientAddress,
                companyId: companyId,
                totalPurchases: 1,
                totalSpent: purchaseAmount,
                invoiceCount: 0,
                isActive: true,
                createdAt: block.timestamp,
                updatedAt: block.timestamp
            });
            
            companyClients[companyId].push(clientAddress);
            clientCompanies[clientAddress].push(companyId);
            
            emit ClientRegistered(clientAddress, companyId);
        } else {
            // Update existing client
            ClientData storage client = clients[companyId][clientAddress];
            unchecked { ++client.totalPurchases; }
            client.totalSpent += purchaseAmount;
            client.updatedAt = block.timestamp;
        }
        
        emit ClientPurchase(clientAddress, companyId, purchaseAmount);
    }

    /**
     * @dev Deactivate a client
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function deactivateClient(uint256 companyId, address clientAddress) external override {
        require(clientExists(companyId, clientAddress), "Clients: Client does not exist");
        require(clients[companyId][clientAddress].isActive, "Clients: Client already deactivated");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(company.owner == msg.sender, "Clients: Not the company owner");
        
        clients[companyId][clientAddress].isActive = false;
        clients[companyId][clientAddress].updatedAt = block.timestamp;
        
        emit ClientDeactivated(clientAddress, companyId);
    }

    /**
     * @dev Reactivate a client
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function reactivateClient(uint256 companyId, address clientAddress) external override {
        require(clientExists(companyId, clientAddress), "Clients: Client does not exist");
        require(!clients[companyId][clientAddress].isActive, "Clients: Client already active");
        
        // Check if caller is the company owner
        ICompany.CompanyData memory company = companyContract.getCompany(companyId);
        require(company.owner == msg.sender, "Clients: Not the company owner");
        
        clients[companyId][clientAddress].isActive = true;
        clients[companyId][clientAddress].updatedAt = block.timestamp;
        
        emit ClientReactivated(clientAddress, companyId);
    }

    /**
     * @dev Get client information
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return client Client data structure
     */
    function getClient(uint256 companyId, address clientAddress) external view override returns (ClientData memory client) {
        require(clientExists(companyId, clientAddress), "Clients: Client does not exist");
        return clients[companyId][clientAddress];
    }

    /**
     * @dev Get all clients for a company
     * @param companyId ID of the company
     * @return clientsArray Array of clients for the company
     */
    function getClientsByCompany(uint256 companyId) external view override returns (ClientData[] memory clientsArray) {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        
        address[] memory clientAddresses = companyClients[companyId];
        uint256 length = clientAddresses.length;
        clientsArray = new ClientData[](length);
        
        for (uint256 i; i < length;) {
            clientsArray[i] = clients[companyId][clientAddresses[i]];
            unchecked { ++i; }
        }
        
        return clientsArray;
    }

    /**
     * @dev Get active clients for a company
     * @param companyId ID of the company
     * @return clientsArray Array of active clients for the company
     */
    function getActiveClientsByCompany(uint256 companyId) external view override returns (ClientData[] memory clientsArray) {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        
        address[] memory clientAddresses = companyClients[companyId];
        uint256 length = clientAddresses.length;
        uint256 activeCount;
        
        // Count active clients
        for (uint256 i; i < length;) {
            if (clients[companyId][clientAddresses[i]].isActive) {
                unchecked { ++activeCount; }
            }
            unchecked { ++i; }
        }
        
        // Create array with active clients
        clientsArray = new ClientData[](activeCount);
        uint256 index;
        
        for (uint256 i; i < length;) {
            if (clients[companyId][clientAddresses[i]].isActive) {
                clientsArray[index] = clients[companyId][clientAddresses[i]];
                unchecked { ++index; }
            }
            unchecked { ++i; }
        }
        
        return clientsArray;
    }

    /**
     * @dev Get clients with filters
     * @param filter Filter structure for client queries
     * @return clientsArray Array of filtered clients
     */
    function getClientsWithFilter(ClientFilter memory filter) external view override returns (ClientData[] memory clientsArray) {
        require(filter.companyId != 0, "Clients: Company ID is required for filtering");
        require(companyContract.companyExists(filter.companyId), "Clients: Company does not exist");
        
        address[] memory clientAddresses = companyClients[filter.companyId];
        uint256 length = clientAddresses.length;
        address[] memory filteredAddresses = new address[](length);
        uint256 count;
        
        for (uint256 i; i < length;) {
            address clientAddr = clientAddresses[i];
            ClientData storage client = clients[filter.companyId][clientAddr];
            
            // Apply filters with early exit optimization
            if (filter.isActive && !client.isActive) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.minTotalSpent > 0 && client.totalSpent < filter.minTotalSpent) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.maxTotalSpent > 0 && client.totalSpent > filter.maxTotalSpent) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.minPurchases > 0 && client.totalPurchases < filter.minPurchases) {
                unchecked { ++i; }
                continue;
            }
            
            if (filter.maxPurchases > 0 && client.totalPurchases > filter.maxPurchases) {
                unchecked { ++i; }
                continue;
            }
            
            filteredAddresses[count] = clientAddr;
            unchecked { 
                ++count;
                ++i;
            }
        }
        
        // Create result array
        clientsArray = new ClientData[](count);
        for (uint256 i; i < count;) {
            clientsArray[i] = clients[filter.companyId][filteredAddresses[i]];
            unchecked { ++i; }
        }
        
        return clientsArray;
    }

    /**
     * @dev Get client statistics for a company
     * @param companyId ID of the company
     * @return stats Client statistics
     */
    function getClientStatsByCompany(uint256 companyId) external view override returns (ClientStats memory stats) {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        
        address[] memory clientAddresses = companyClients[companyId];
        uint256 length = clientAddresses.length;
        
        stats.totalClients = length;
        
        for (uint256 i; i < length;) {
            ClientData storage client = clients[companyId][clientAddresses[i]];
            
            stats.totalSpent += client.totalSpent;
            stats.totalPurchases += client.totalPurchases;
            
            if (client.isActive) {
                unchecked { ++stats.activeClients; }
            } else {
                unchecked { ++stats.inactiveClients; }
            }
            
            unchecked { ++i; }
        }
        
        // Calculate average spent per client
        if (stats.totalClients > 0) {
            stats.averageSpentPerClient = stats.totalSpent / stats.totalClients;
        }
        
        return stats;
    }

    /**
     * @dev Get all companies a client has purchased from
     * @param clientAddress Address of the client
     * @return companyIds Array of company IDs the client has purchased from
     */
    function getClientCompanies(address clientAddress) external view override returns (uint256[] memory companyIds) {
        require(clientAddress != address(0), "Clients: Invalid client address");
        return clientCompanies[clientAddress];
    }

    /**
     * @dev Check if a client exists for a company
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return exists True if client exists, false otherwise
     */
    function clientExists(uint256 companyId, address clientAddress) public view override returns (bool exists) {
        return clients[companyId][clientAddress].clientAddress != address(0);
    }

    /**
     * @dev Check if a client is active for a company
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return isActive True if client is active, false otherwise
     */
    function isClientActive(uint256 companyId, address clientAddress) external view override returns (bool isActive) {
        require(clientExists(companyId, clientAddress), "Clients: Client does not exist");
        return clients[companyId][clientAddress].isActive;
    }

    /**
     * @dev Get total number of clients for a company
     * @param companyId ID of the company
     * @return count Total number of clients
     */
    function getClientCountByCompany(uint256 companyId) external view override returns (uint256 count) {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        return companyClients[companyId].length;
    }

    /**
     * @dev Get client addresses by company
     * @param companyId ID of the company
     * @return clientAddresses Array of client addresses for the company
     */
    function getClientAddressesByCompany(uint256 companyId) external view override returns (address[] memory clientAddresses) {
        require(companyContract.companyExists(companyId), "Clients: Company does not exist");
        return companyClients[companyId];
    }

    /**
     * @dev Update company contract address (only owner)
     * @param newCompanyContract Address of the new company contract
     */
    function updateCompanyContract(address newCompanyContract) external onlyOwner {
        require(newCompanyContract != address(0), "Clients: Invalid company contract address");
        companyContract = ICompany(newCompanyContract);
    }

    /**
     * @dev Increment invoice count for a client (called by authorized contracts)
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function incrementInvoiceCount(uint256 companyId, address clientAddress) external {
        require(clientExists(companyId, clientAddress), "Clients: Client does not exist");
        require(authorizedContracts[msg.sender], "Clients: Not authorized to increment invoice count");
        
        unchecked { ++clients[companyId][clientAddress].invoiceCount; }
        clients[companyId][clientAddress].updatedAt = block.timestamp;
    }
}
