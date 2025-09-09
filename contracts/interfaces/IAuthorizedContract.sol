// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAuthorizedContract
 * @dev Interface for contracts that support authorization system
 * This interface defines the common functions for managing authorized contracts
 */
interface IAuthorizedContract {
    // Events
    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);
    
    // Functions
    function authorizedContracts(address contractAddress) external view returns (bool);
    function authorizeContract(address contractAddress) external;
    function deauthorizeContract(address contractAddress) external;
}
