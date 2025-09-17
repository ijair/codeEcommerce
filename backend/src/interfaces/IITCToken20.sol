// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IITCToken20
 * @dev Interface for ITCToken-20 contract
 * @notice This interface extends IERC20 and adds buy/withdraw functionality for e-commerce
 */
interface IITCToken20 is IERC20 {
    /**
     * @dev Emitted when tokens are purchased
     * @param buyer Address of the buyer
     * @param amount Amount of tokens purchased
     * @param ethAmount Amount of ETH paid
     */
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethAmount);

    /**
     * @dev Emitted when tokens are withdrawn
     * @param seller Address of the seller
     * @param amount Amount of tokens withdrawn
     * @param ethAmount Amount of ETH received
     */
    event TokensWithdrawn(address indexed seller, uint256 amount, uint256 ethAmount);

    /**
     * @dev Emitted when token price is updated
     * @param newPrice New price per token in wei
     */
    event TokenPriceUpdated(uint256 newPrice);

    /**
     * @dev Purchase tokens with ETH
     * @notice Users can buy tokens by sending ETH to this function
     * @param amount Amount of tokens to purchase
     */
    function buyTokens(uint256 amount) external payable;

    /**
     * @dev Withdraw tokens for ETH
     * @notice Users can exchange their tokens back to ETH
     * @param amount Amount of tokens to withdraw
     */
    function withdrawTokens(uint256 amount) external;

    /**
     * @dev Get current token price in wei
     * @return price Current price per token in wei
     */
    function getTokenPrice() external view returns (uint256 price);

    /**
     * @dev Set token price (only owner)
     * @param newPrice New price per token in wei
     */
    function setTokenPrice(uint256 newPrice) external;

    /**
     * @dev Get contract ETH balance
     * @return balance Current ETH balance of the contract
     */
    function getContractBalance() external view returns (uint256 balance);

    /**
     * @dev Calculate total cost for buying tokens including Stripe and gas fees
     * @param tokenAmount Amount of tokens to purchase
     * @return totalCost Total cost in wei including all fees
     * @return stripeFee Stripe fee in wei
     * @return gasFee Estimated gas fee in wei
     */
    function calculateBuyTokensCost(uint256 tokenAmount) external view returns (uint256 totalCost, uint256 stripeFee, uint256 gasFee);

    /**
     * @dev Calculate net amount received when withdrawing tokens after fees
     * @param tokenAmount Amount of tokens to withdraw
     * @return netAmount Net ETH amount received after fees
     * @return stripeFee Stripe fee in wei
     * @return gasFee Estimated gas fee in wei
     */
    function calculateWithdrawTokensNet(uint256 tokenAmount) external view returns (uint256 netAmount, uint256 stripeFee, uint256 gasFee);

    /**
     * @dev Get current Stripe fee configuration
     * @return fixedFee Fixed fee in wei
     * @return percentageFee Percentage fee in basis points (100 = 1%)
     */
    function getStripeFeeConfig() external view returns (uint256 fixedFee, uint256 percentageFee);

    /**
     * @dev Get current gas fee estimate
     * @return gasFee Current gas fee estimate in wei
     */
    function getGasFeeEstimate() external view returns (uint256 gasFee);

    /**
     * @dev Set Stripe fee configuration (only owner)
     * @param fixedFee Fixed fee in wei
     * @param percentageFee Percentage fee in basis points (100 = 1%)
     */
    function setStripeFeeConfig(uint256 fixedFee, uint256 percentageFee) external;

    /**
     * @dev Set gas fee estimate (only owner)
     * @param gasFee Gas fee estimate in wei
     */
    function setGasFeeEstimate(uint256 gasFee) external;
}
