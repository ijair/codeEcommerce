import { formatEther, parseEther } from 'ethers';
import { contractService } from './contractService';
import type { 
  TokenFees, 
  TokenBalance, 
  TokenPurchaseResult, 
  TokenWithdrawResult
} from '../types/contracts';

class TokenService {
  /**
   * Get user token and ETH balances
   */
  async getUserBalances(userAddress: string): Promise<TokenBalance | null> {
    try {
      const tokenContract = contractService.getContract('token');
      const signer = tokenContract?.runner;
      
      if (!tokenContract || !signer) {
        throw new Error('Token contract or signer not available');
      }

      // Get token balance
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      const tokenBalanceFormatted = formatEther(tokenBalance);

      // Get ETH balance from provider
      const ethProvider = signer.provider;
      if (!ethProvider) {
        throw new Error('Provider not available');
      }
      
      const ethBalance = await ethProvider.getBalance(userAddress);
      const ethBalanceFormatted = formatEther(ethBalance);

      return {
        balance: tokenBalance.toString(),
        balanceFormatted: tokenBalanceFormatted,
        ethBalance: ethBalance.toString(),
        ethBalanceFormatted: ethBalanceFormatted,
      };
    } catch (error: any) {
      console.error('Error getting user balances:', error);
      return null;
    }
  }

  /**
   * Get token price and fee information
   */
  async getTokenPriceInfo(): Promise<{
    tokenPrice: string;
    tokenPriceFormatted: string;
    stripeFeeConfig: { fixedFee: string; percentageFee: string };
    gasFeeEstimate: string;
  } | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const [tokenPrice, stripeFeeConfig, gasFeeEstimate] = await Promise.all([
        tokenContract.getTokenPrice(),
        tokenContract.getStripeFeeConfig(),
        tokenContract.getGasFeeEstimate(),
      ]);

      return {
        tokenPrice: tokenPrice.toString(),
        tokenPriceFormatted: formatEther(tokenPrice),
        stripeFeeConfig: {
          fixedFee: stripeFeeConfig[0].toString(),
          percentageFee: stripeFeeConfig[1].toString(),
        },
        gasFeeEstimate: gasFeeEstimate.toString(),
      };
    } catch (error: any) {
      console.error('Error getting token price info:', error);
      return null;
    }
  }

  /**
   * Calculate buy tokens cost including fees
   */
  async calculateBuyTokensCost(tokenAmount: string): Promise<TokenFees | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const tokenAmountWei = parseEther(tokenAmount);
      const result = await tokenContract.calculateBuyTokensCost(tokenAmountWei);

      return {
        totalCost: result[0].toString(),
        stripeFee: result[1].toString(),
        gasFee: result[2].toString(),
      };
    } catch (error: any) {
      console.error('Error calculating buy tokens cost:', error);
      return null;
    }
  }

  /**
   * Calculate withdraw tokens net amount after fees
   */
  async calculateWithdrawTokensNet(tokenAmount: string): Promise<{ netAmount: string; stripeFee: string; gasFee: string } | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const tokenAmountWei = parseEther(tokenAmount);
      const result = await tokenContract.calculateWithdrawTokensNet(tokenAmountWei);

      return {
        netAmount: result[0].toString(),
        stripeFee: result[1].toString(),
        gasFee: result[2].toString(),
      };
    } catch (error: any) {
      console.error('Error calculating withdraw tokens net:', error);
      return null;
    }
  }

  /**
   * Buy tokens (after Stripe payment confirmation)
   */
  async buyTokens(tokenAmount: string, userAddress: string): Promise<TokenPurchaseResult> {
    try {
      const tokenContract = contractService.getContract('token');
      
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      // Get token price to calculate ETH cost
      const tokenPrice = await tokenContract.getTokenPrice();
      const tokenAmountWei = parseEther(tokenAmount);
      
      // Calculate ETH cost: (tokenAmount * tokenPrice) / 1e18
      const ethCost = (tokenAmountWei * tokenPrice) / BigInt('1000000000000000000');

      // Check if user has enough ETH
      const signer = tokenContract.runner;
      const ethProvider = signer?.provider;
      if (!ethProvider) {
        throw new Error('Provider not available');
      }
      
      const userBalance = await ethProvider.getBalance(userAddress);
      
      if (userBalance < ethCost) {
        return {
          success: false,
          error: `Insufficient ETH balance. Required: ${formatEther(ethCost)} ETH, Available: ${formatEther(userBalance)} ETH`,
        };
      }

      // Check if owner has enough tokens to sell
      const ownerAddress = await tokenContract.owner();
      const ownerTokenBalance = await tokenContract.balanceOf(ownerAddress);
      
      if (ownerTokenBalance < tokenAmountWei) {
        return {
          success: false,
          error: `Insufficient tokens available. Requested: ${tokenAmount} ITC, Available: ${formatEther(ownerTokenBalance)} ITC`,
        };
      }

      // Simulate Stripe payment processing
      console.log('Processing Stripe payment simulation...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay

      // Execute token purchase - new function doesn't take parameters
      const tx = await tokenContract.buyTokens({
        value: ethCost,
        gasLimit: 300000,
      });

      console.log('Token purchase transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Token purchase confirmed:', receipt.transactionHash);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      
      // Handle specific error cases
      if (error.message.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient ETH balance for transaction and gas fees',
        };
      }
      
      if (error.message.includes('user rejected')) {
        return {
          success: false,
          error: 'Transaction rejected by user',
        };
      }

      if (error.message.includes('No hay suficientes tokens disponibles')) {
        return {
          success: false,
          error: 'Not enough tokens available from owner. Please try a smaller amount.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to purchase tokens',
      };
    }
  }

  /**
   * Withdraw tokens (convert back to ETH)
   */
  async withdrawTokens(tokenAmount: string, userAddress: string): Promise<TokenWithdrawResult> {
    try {
      const tokenContract = contractService.getContract('token');
      
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      // Check if user has enough tokens
      const userTokenBalance = await tokenContract.balanceOf(userAddress);
      const tokenAmountWei = parseEther(tokenAmount);
      
      if (userTokenBalance < tokenAmountWei) {
        return {
          success: false,
          error: `Insufficient token balance. Required: ${tokenAmount} ITC, Available: ${formatEther(userTokenBalance)} ITC`,
        };
      }

      // Calculate net amount after fees
      const netInfo = await this.calculateWithdrawTokensNet(tokenAmount);
      if (!netInfo) {
        throw new Error('Failed to calculate withdrawal amount');
      }

      // Execute token withdrawal
      const tx = await tokenContract.withdrawTokens(tokenAmountWei, {
        gasLimit: 300000,
      });

      console.log('Token withdrawal transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Token withdrawal confirmed:', receipt.transactionHash);

      return {
        success: true,
        message: 'Tokens withdrawn successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error withdrawing tokens:', error);
      
      // Handle specific error cases
      if (error.message.includes('insufficient funds')) {
      return {
        success: false,
        message: 'Transaction failed',
        error: 'Insufficient token balance',
      };
      }
      
      if (error.message.includes('user rejected')) {
        return {
          success: false,
          message: 'Transaction cancelled',
          error: 'Transaction rejected by user',
        };
      }

      return {
        success: false,
        message: 'Transaction failed',
        error: error.message || 'Failed to withdraw tokens',
      };
    }
  }

  /**
   * Owner function to add more tokens to their balance
   */
  async fullFillTokens(ethAmount: string): Promise<TokenPurchaseResult> {
    try {
      const tokenContract = contractService.getContract('token');
      
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const ethAmountWei = parseEther(ethAmount);

      // Check if user is the owner
      const signer = tokenContract.runner;
      if (!signer) {
        throw new Error('Signer not available');
      }
      
      const userAddress = await (signer as any).getAddress();
      const ownerAddress = await tokenContract.owner();
      
      if (userAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        return {
          success: false,
          error: 'Only the contract owner can use this function',
        };
      }

      // Check if user has enough ETH
      const ethProvider = signer.provider;
      if (!ethProvider) {
        throw new Error('Provider not available');
      }
      
      const userBalance = await ethProvider.getBalance(userAddress);
      
      if (userBalance < ethAmountWei) {
        return {
          success: false,
          error: `Insufficient ETH balance. Required: ${ethAmount} ETH, Available: ${formatEther(userBalance)} ETH`,
        };
      }

      // Execute fullFillTokens
      const tx = await tokenContract.fullFillTokens({
        value: ethAmountWei,
        gasLimit: 300000,
      });

      console.log('FullFill tokens transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('FullFill tokens confirmed:', receipt.transactionHash);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error in fullFillTokens:', error);
      
      // Handle specific error cases
      if (error.message.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient ETH balance for transaction and gas fees',
        };
      }
      
      if (error.message.includes('user rejected')) {
        return {
          success: false,
          error: 'Transaction rejected by user',
        };
      }

      if (error.message.includes('Access Denied')) {
        return {
          success: false,
          error: 'Access denied. Only the contract owner can use this function.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fulfill tokens',
      };
    }
  }

  /**
   * Get token contract information
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    maxSupply: string;
    remainingSupply: string;
    totalSupplyFormatted: string;
    maxSupplyFormatted: string;
    remainingSupplyFormatted: string;
  } | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const [name, symbol, decimals, totalSupply, maxSupply, remainingSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.getMaxSupply(),
        tokenContract.getRemainingSupply(),
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply.toString(),
        remainingSupply: remainingSupply.toString(),
        totalSupplyFormatted: formatEther(totalSupply),
        maxSupplyFormatted: formatEther(maxSupply),
        remainingSupplyFormatted: formatEther(remainingSupply),
      };
    } catch (error: any) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Check if current user is the contract owner
   */
  async isOwner(): Promise<boolean> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        return false;
      }

      const signer = tokenContract.runner;
      if (!signer) {
        return false;
      }

      const userAddress = await (signer as any).getAddress();
      const ownerAddress = await tokenContract.owner();
      
      return userAddress.toLowerCase() === ownerAddress.toLowerCase();
    } catch (error: any) {
      console.error('Error checking owner status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();
