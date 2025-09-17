// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IITCToken20.sol";

/**
 * @title ITCToken20
 * @dev ERC-20 token contract for e-commerce platform
 * @notice This contract allows users to buy and withdraw tokens using ETH
 * @author E-commerce Platform Team
 */
contract ITCToken20 is ERC20, Ownable, ReentrancyGuard, IITCToken20 {
    // Token price in wei (1 token = 0.001 ETH by default)
    uint256 public tokenPrice = 0.001 ether;
    
    // Maximum supply of tokens
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    
    // Stripe fee configuration
    uint256 public stripeFixedFee = 0.30 ether; // $0.30 fixed fee (assuming 1 ETH = $1000)
    uint256 public stripePercentageFee = 290; // 2.9% in basis points (290/10000)
    
    // Gas fee estimate for transactions
    uint256 public gasFeeEstimate = 0.002 ether; // Estimated gas fee
    
    // Events are inherited from IITCToken20 interface
    
    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     * @notice Mints initial supply to the owner
     */
    constructor(address initialOwner) 
        ERC20("ITC Token", "ITC") 
        Ownable(initialOwner) 
    {
        // Mint initial supply to the owner (10% of max supply)
        uint256 initialSupply = (MAX_SUPPLY * 10) / 100;
        _mint(initialOwner, initialSupply);
    }

    /**
     * @dev Purchase tokens with ETH
     * @param amount Amount of tokens to purchase
     * @notice Users can buy tokens by sending ETH to this function
     */
    function buyTokens(uint256 amount) external payable override nonReentrant {
        require(amount > 0, "ITCToken20: Amount must be greater than zero");
        require(msg.value >= amount * tokenPrice, "ITCToken20: Insufficient ETH sent");
        
        uint256 totalCost = amount * tokenPrice;
        uint256 change = msg.value - totalCost;
        
        // Check if we have enough tokens to sell
        require(totalSupply() + amount <= MAX_SUPPLY, "ITCToken20: Exceeds maximum supply");
        
        // Mint tokens to the buyer
        _mint(msg.sender, amount);
        
        // Refund excess ETH
        if (change > 0) {
            payable(msg.sender).transfer(change);
        }
        
        emit TokensPurchased(msg.sender, amount, totalCost);
    }

    /**
     * @dev Withdraw tokens for ETH
     * @param amount Amount of tokens to withdraw
     * @notice Users can exchange their tokens back to ETH
     */
    function withdrawTokens(uint256 amount) external override nonReentrant {
        require(amount > 0, "ITCToken20: Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "ITCToken20: Insufficient token balance");
        require(address(this).balance >= amount * tokenPrice, "ITCToken20: Insufficient contract balance");
        
        uint256 ethAmount = amount * tokenPrice;
        
        // Burn tokens from the user
        _burn(msg.sender, amount);
        
        // Transfer ETH to the user
        payable(msg.sender).transfer(ethAmount);
        
        emit TokensWithdrawn(msg.sender, amount, ethAmount);
    }

    /**
     * @dev Get current token price in wei
     * @return price Current price per token in wei
     */
    function getTokenPrice() external view override returns (uint256 price) {
        return tokenPrice;
    }

    /**
     * @dev Set token price (only owner)
     * @param newPrice New price per token in wei
     */
    function setTokenPrice(uint256 newPrice) external override onlyOwner {
        require(newPrice > 0, "ITCToken20: Price must be greater than zero");
        tokenPrice = newPrice;
        emit TokenPriceUpdated(newPrice);
    }

    /**
     * @dev Get contract ETH balance
     * @return balance Current ETH balance of the contract
     */
    function getContractBalance() external view override returns (uint256 balance) {
        return address(this).balance;
    }

    /**
     * @dev Withdraw ETH from contract (only owner)
     * @param amount Amount of ETH to withdraw
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "ITCToken20: Insufficient contract balance");
        payable(owner()).transfer(amount);
    }

    /**
     * @dev Withdraw all ETH from contract (only owner)
     */
    function withdrawAllETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ITCToken20: No ETH to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Mint tokens to a specific address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ITCToken20: Cannot mint to zero address");
        require(amount > 0, "ITCToken20: Amount must be greater than zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "ITCToken20: Exceeds maximum supply");
        
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from a specific address (only owner)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "ITCToken20: Cannot burn from zero address");
        require(amount > 0, "ITCToken20: Amount must be greater than zero");
        require(balanceOf(from) >= amount, "ITCToken20: Insufficient balance to burn");
        
        _burn(from, amount);
    }

    /**
     * @dev Get maximum supply
     * @return Maximum supply of tokens
     */
    function getMaxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev Get remaining supply that can be minted
     * @return Remaining supply that can be minted
     */
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Allow contract to receive ETH
    }

    /**
     * @dev Fallback function to accept ETH
     */
    fallback() external payable {
        // Allow contract to receive ETH
    }

    /**
     * @dev Calculate total cost for buying tokens including Stripe and gas fees
     * @param tokenAmount Amount of tokens to purchase
     * @return totalCost Total cost in wei including all fees
     * @return stripeFee Stripe fee in wei
     * @return gasFee Estimated gas fee in wei
     */
    function calculateBuyTokensCost(uint256 tokenAmount) external view override returns (uint256 totalCost, uint256 stripeFee, uint256 gasFee) {
        require(tokenAmount > 0, "ITCToken20: Token amount must be greater than zero");
        
        uint256 tokenCost = tokenAmount * tokenPrice;
        
        // Calculate Stripe fees: fixed fee + percentage fee
        stripeFee = stripeFixedFee + (tokenCost * stripePercentageFee) / 10000;
        
        // Gas fee estimate
        gasFee = gasFeeEstimate;
        
        // Total cost = token cost + stripe fees + gas fees
        totalCost = tokenCost + stripeFee + gasFee;
        
        return (totalCost, stripeFee, gasFee);
    }

    /**
     * @dev Calculate net amount received when withdrawing tokens after fees
     * @param tokenAmount Amount of tokens to withdraw
     * @return netAmount Net ETH amount received after fees
     * @return stripeFee Stripe fee in wei
     * @return gasFee Estimated gas fee in wei
     */
    function calculateWithdrawTokensNet(uint256 tokenAmount) external view override returns (uint256 netAmount, uint256 stripeFee, uint256 gasFee) {
        require(tokenAmount > 0, "ITCToken20: Token amount must be greater than zero");
        
        uint256 grossAmount = tokenAmount * tokenPrice;
        
        // Calculate Stripe fees for withdrawal
        stripeFee = stripeFixedFee + (grossAmount * stripePercentageFee) / 10000;
        
        // Gas fee estimate
        gasFee = gasFeeEstimate;
        
        // Net amount = gross amount - stripe fees - gas fees
        uint256 totalFees = stripeFee + gasFee;
        require(grossAmount > totalFees, "ITCToken20: Amount too small to cover fees");
        
        netAmount = grossAmount - totalFees;
        
        return (netAmount, stripeFee, gasFee);
    }

    /**
     * @dev Get current Stripe fee configuration
     * @return fixedFee Fixed fee in wei
     * @return percentageFee Percentage fee in basis points (100 = 1%)
     */
    function getStripeFeeConfig() external view override returns (uint256 fixedFee, uint256 percentageFee) {
        return (stripeFixedFee, stripePercentageFee);
    }

    /**
     * @dev Get current gas fee estimate
     * @return gasFee Current gas fee estimate in wei
     */
    function getGasFeeEstimate() external view override returns (uint256 gasFee) {
        return gasFeeEstimate;
    }

    /**
     * @dev Set Stripe fee configuration (only owner)
     * @param fixedFee Fixed fee in wei
     * @param percentageFee Percentage fee in basis points (100 = 1%)
     */
    function setStripeFeeConfig(uint256 fixedFee, uint256 percentageFee) external override onlyOwner {
        require(percentageFee <= 1000, "ITCToken20: Percentage fee too high (max 10%)");
        stripeFixedFee = fixedFee;
        stripePercentageFee = percentageFee;
    }

    /**
     * @dev Set gas fee estimate (only owner)
     * @param gasFee Gas fee estimate in wei
     */
    function setGasFeeEstimate(uint256 gasFee) external override onlyOwner {
        require(gasFee <= 0.1 ether, "ITCToken20: Gas fee estimate too high");
        gasFeeEstimate = gasFee;
    }
}
