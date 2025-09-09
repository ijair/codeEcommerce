// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ITCToken
 * @dev Custom ERC20 token for the e-commerce platform
 * This token will be used for payments within the platform
 * Frontend will handle Stripe integration and call mint function after successful payment
 */
contract ITCToken is ERC20, Ownable, Pausable {
    // Token decimals
    uint8 private constant DECIMALS = 18;
    
    // Maximum supply: 1 billion tokens
    uint256 private constant MAX_SUPPLY = 1_000_000_000 * 10**DECIMALS;
    
    // Exchange rate: 1 EUR = 100 ITC tokens (with 18 decimals)
    uint256 public constant EUR_TO_ITC_RATE = 100 * 10**DECIMALS;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string paymentId);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor() ERC20("ITC Token", "ITC") Ownable(msg.sender) {
        // Mint initial supply to the contract owner
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    /**
     * @dev Returns the number of decimals used
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Mint tokens to a specific address (called by frontend after Stripe payment)
     * @param to Address to mint tokens to
     * @param eurAmount Amount in EUR (with 2 decimals)
     * @param paymentId Stripe payment ID for tracking
     * @return tokenAmount Amount of tokens minted
     */
    function mintTokens(address to, uint256 eurAmount, string calldata paymentId) 
        external 
        onlyOwner 
        whenNotPaused 
        returns (uint256 tokenAmount) 
    {
        require(to != address(0), "ITCToken: Invalid address");
        require(eurAmount > 0, "ITCToken: EUR amount must be greater than 0");
        require(bytes(paymentId).length > 0, "ITCToken: Payment ID required");
        
        // Convert EUR to tokens (EUR has 2 decimals, so we multiply by 10^16 to get 18 decimals)
        tokenAmount = (eurAmount * EUR_TO_ITC_RATE) / 100;
        
        // Check if we have enough tokens to mint
        require(totalSupply() + tokenAmount <= MAX_SUPPLY, "ITCToken: Exceeds maximum supply");
        
        _mint(to, tokenAmount);
        
        emit TokensMinted(to, tokenAmount, paymentId);
        return tokenAmount;
    }
    
    /**
     * @dev Burn tokens from a specific address (for token redemption)
     * @param from Address to burn tokens from
     * @param tokenAmount Amount of tokens to burn
     * @return eurAmount Amount in EUR equivalent
     */
    function burnTokens(address from, uint256 tokenAmount) 
        external 
        onlyOwner 
        whenNotPaused 
        returns (uint256 eurAmount) 
    {
        require(from != address(0), "ITCToken: Invalid address");
        require(tokenAmount > 0, "ITCToken: Token amount must be greater than 0");
        require(balanceOf(from) >= tokenAmount, "ITCToken: Insufficient token balance");
        
        // Convert tokens to EUR
        eurAmount = (tokenAmount * 100) / EUR_TO_ITC_RATE;
        
        // Burn the tokens
        _burn(from, tokenAmount);
        
        emit TokensBurned(from, tokenAmount);
        return eurAmount;
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer functions to include pausable functionality
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._update(from, to, amount);
    }
}