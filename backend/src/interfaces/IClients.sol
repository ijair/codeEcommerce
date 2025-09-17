// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClients
 * @dev Interface for Clients contract
 * @notice This interface defines client management functionality for e-commerce
 */
interface IClients {
    /**
     * @dev Client data structure
     */
    struct ClientData {
        address clientAddress;
        uint256 companyId;
        uint256 totalPurchases;
        uint256 totalSpent;
        uint256 invoiceCount;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    /**
     * @dev Client filter structure for queries
     */
    struct ClientFilter {
        uint256 companyId;
        uint256 minTotalSpent;
        uint256 maxTotalSpent;
        uint256 minPurchases;
        uint256 maxPurchases;
        bool isActive;
    }

    /**
     * @dev Client statistics structure
     */
    struct ClientStats {
        uint256 totalClients;
        uint256 activeClients;
        uint256 inactiveClients;
        uint256 totalSpent;
        uint256 totalPurchases;
        uint256 averageSpentPerClient;
    }

    /**
     * @dev Emitted when a client is registered
     * @param clientAddress Address of the client
     * @param companyId ID of the company
     */
    event ClientRegistered(address indexed clientAddress, uint256 indexed companyId);

    /**
     * @dev Emitted when a client makes a purchase
     * @param clientAddress Address of the client
     * @param companyId ID of the company
     * @param amount Amount spent
     */
    event ClientPurchase(address indexed clientAddress, uint256 indexed companyId, uint256 amount);

    /**
     * @dev Emitted when a client is deactivated
     * @param clientAddress Address of the client
     * @param companyId ID of the company
     */
    event ClientDeactivated(address indexed clientAddress, uint256 indexed companyId);

    /**
     * @dev Emitted when a client is reactivated
     * @param clientAddress Address of the client
     * @param companyId ID of the company
     */
    event ClientReactivated(address indexed clientAddress, uint256 indexed companyId);

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
    ) external;

    /**
     * @dev Deactivate a client
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function deactivateClient(uint256 companyId, address clientAddress) external;

    /**
     * @dev Reactivate a client
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function reactivateClient(uint256 companyId, address clientAddress) external;

    /**
     * @dev Get client information
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return client Client data structure
     */
    function getClient(uint256 companyId, address clientAddress) external view returns (ClientData memory client);

    /**
     * @dev Get all clients for a company
     * @param companyId ID of the company
     * @return clientsArray Array of clients for the company
     */
    function getClientsByCompany(uint256 companyId) external view returns (ClientData[] memory clientsArray);

    /**
     * @dev Get active clients for a company
     * @param companyId ID of the company
     * @return clientsArray Array of active clients for the company
     */
    function getActiveClientsByCompany(uint256 companyId) external view returns (ClientData[] memory clientsArray);

    /**
     * @dev Get clients with filters
     * @param filter Filter structure for client queries
     * @return clientsArray Array of filtered clients
     */
    function getClientsWithFilter(ClientFilter memory filter) external view returns (ClientData[] memory clientsArray);

    /**
     * @dev Get client statistics for a company
     * @param companyId ID of the company
     * @return stats Client statistics
     */
    function getClientStatsByCompany(uint256 companyId) external view returns (ClientStats memory stats);

    /**
     * @dev Get all companies a client has purchased from
     * @param clientAddress Address of the client
     * @return companyIds Array of company IDs the client has purchased from
     */
    function getClientCompanies(address clientAddress) external view returns (uint256[] memory companyIds);

    /**
     * @dev Check if a client exists for a company
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return exists True if client exists, false otherwise
     */
    function clientExists(uint256 companyId, address clientAddress) external view returns (bool exists);

    /**
     * @dev Check if a client is active for a company
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     * @return isActive True if client is active, false otherwise
     */
    function isClientActive(uint256 companyId, address clientAddress) external view returns (bool isActive);

    /**
     * @dev Get total number of clients for a company
     * @param companyId ID of the company
     * @return count Total number of clients
     */
    function getClientCountByCompany(uint256 companyId) external view returns (uint256 count);

    /**
     * @dev Get client addresses by company
     * @param companyId ID of the company
     * @return clientAddresses Array of client addresses for the company
     */
    function getClientAddressesByCompany(uint256 companyId) external view returns (address[] memory clientAddresses);

    /**
     * @dev Authorize a contract to register purchases (only owner)
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external;

    /**
     * @dev Revoke authorization from a contract (only owner)
     * @param contractAddress Address of the contract to revoke
     */
    function revokeContractAuthorization(address contractAddress) external;

    /**
     * @dev Increment invoice count for a client (called by authorized contracts)
     * @param companyId ID of the company
     * @param clientAddress Address of the client
     */
    function incrementInvoiceCount(uint256 companyId, address clientAddress) external;
}
