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
     * @dev Emitted when tokens are burned
     * @param burner Address of the user who burned tokens
     * @param amount Amount of tokens burned
     * @param burnId Unique ID for this burn transaction
     * @param timestamp When the burn occurred
     * @param totalBurned Total amount of tokens burned so far
     */
    event TokensBurned(address indexed burner, uint256 amount, uint256 burnId, uint256 timestamp, uint256 totalBurned);

    /**
     * @dev Purchase tokens with ETH (transfers from owner balance)
     * @notice Users can buy tokens after Stripe payment confirmation
     */
    function buyTokens() external payable;

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

    /**
     * @dev Full fill tokens - Owner can create more tokens by sending ETH
     * @notice Only owner can call this function to mint tokens to their own balance
     */
    function fullFillTokens() external payable;

    /**
     * @dev Get the contract owner address
     * @return owner Address of the contract owner
     */
    function owner() external view returns (address owner);

    /**
     * @dev Get maximum supply of tokens
     * @return maxSupply Maximum supply of tokens
     */
    function getMaxSupply() external pure returns (uint256 maxSupply);

    /**
     * @dev Get remaining supply that can be minted
     * @return remainingSupply Remaining supply that can be minted
     */
    function getRemainingSupply() external view returns (uint256 remainingSupply);

    /**
     * @dev Self-burn tokens - allows users to burn their own tokens
     * @param amount Amount of tokens to burn
     */
    function selfBurn(uint256 amount) external;

    /**
     * @dev Get burn record by ID
     * @param burnId ID of the burn record
     * @return burner Address of the burner
     * @return amount Amount burned
     * @return timestamp When the burn occurred
     * @return burnId The burn ID
     */
    function getBurnRecord(uint256 burnId) external view returns (address burner, uint256 amount, uint256 timestamp, uint256);

    /**
     * @dev Get total number of burn transactions
     * @return Total number of burn transactions
     */
    function getTotalBurnTransactions() external view returns (uint256);

    /**
     * @dev Get total amount of tokens burned
     * @return Total amount of tokens burned
     */
    function getTotalTokensBurned() external view returns (uint256);

    /**
     * @dev Get all burn IDs (for enumeration)
     * @return Array of all burn IDs
     */
    function getAllBurnIds() external view returns (uint256[] memory);

    /**
     * @dev Get burn records in a range
     * @param start Start index (0-based)
     * @param end End index (exclusive)
     * @return burners Array of burner addresses
     * @return amounts Array of amounts burned
     * @return timestamps Array of timestamps
     * @return burnIds Array of burn IDs
     */
    function getBurnRecordsRange(uint256 start, uint256 end) external view returns (
        address[] memory burners,
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory burnIds
    );

    /**
     * @dev Get burn statistics
     * @return totalBurned Total amount of tokens burned
     * @return totalTransactions Total number of burn transactions
     * @return averageBurnAmount Average amount per burn transaction
     */
    function getBurnStatistics() external view returns (uint256 totalBurned, uint256 totalTransactions, uint256 averageBurnAmount);
}
