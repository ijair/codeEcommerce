// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAuthorizedContract.sol";

/**
 * @title AuthorizedContract
 * @dev Base contract that implements the authorization system
 * This contract provides common authorization functionality that can be inherited
 * by other contracts to avoid code duplication
 */
abstract contract AuthorizedContract is Ownable, IAuthorizedContract {
    // Authorized contracts that can call protected functions
    mapping(address => bool) public override authorizedContracts;
    
    // Events are inherited from IAuthorizedContract interface
    
    // Modifiers
    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    // Functions
    function authorizeContract(address contractAddress) external override onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        require(!authorizedContracts[contractAddress], "Contract already authorized");
        
        authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }
    
    function deauthorizeContract(address contractAddress) external override onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        require(authorizedContracts[contractAddress], "Contract not authorized");
        
        authorizedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }
}
