import { useState, useEffect } from 'react';
import { tokenService } from '../services/tokenService';
import { contractService } from '../services/contractService';
import type { TokenBalance, TokenPurchaseResult, TokenWithdrawResult } from '../types/contracts';
import { useWallet } from './useWallet';
import { useContracts } from './useContracts';

export const useTokens = () => {
  const { address, isConnected, provider, signer } = useWallet();
  const { isInitialized } = useContracts();
  
  const [balances, setBalances] = useState<TokenBalance | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [priceInfo, setPriceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load balances and token info when wallet connects
  useEffect(() => {
    if (isConnected && address && provider && signer) {
      // Try to initialize contracts if not already done
      if (!isInitialized) {
        const initAndLoad = async () => {
          try {
            const networkKey = 'local'; // Default to local for now
            await contractService.initialize(provider, signer, networkKey);
            loadTokenData();
          } catch (err) {
            console.error('Failed to initialize contracts in useTokens:', err);
            setError('Failed to initialize contracts');
          }
        };
        initAndLoad();
      } else {
        loadTokenData();
      }
    } else {
      setBalances(null);
      setTokenInfo(null);
      setPriceInfo(null);
    }
  }, [isConnected, address, provider, signer, isInitialized]);

  const loadTokenData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [balanceData, infoData, priceData] = await Promise.all([
        tokenService.getUserBalances(address),
        tokenService.getTokenInfo(),
        tokenService.getTokenPriceInfo(),
      ]);
      
      setBalances(balanceData);
      setTokenInfo(infoData);
      setPriceInfo(priceData);
    } catch (err: any) {
      console.error('Error loading token data:', err);
      setError(err.message || 'Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBuyTokensCost = async (tokenAmount: string) => {
    try {
      return await tokenService.calculateBuyTokensCost(tokenAmount);
    } catch (err: any) {
      console.error('Error calculating buy cost:', err);
      return null;
    }
  };

  const calculateWithdrawTokensNet = async (tokenAmount: string) => {
    try {
      return await tokenService.calculateWithdrawTokensNet(tokenAmount);
    } catch (err: any) {
      console.error('Error calculating withdraw net:', err);
      return null;
    }
  };

  const buyTokens = async (tokenAmount: string): Promise<TokenPurchaseResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenService.buyTokens(tokenAmount, address);
      
      if (result.success) {
        // Reload balances after successful purchase
        await loadTokenData();
      } else {
        setError(result.error || 'Failed to purchase tokens');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to purchase tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const burnTokens = async (tokenAmount: string): Promise<TokenWithdrawResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenService.burnTokens(tokenAmount, address);
      
      if (result.success) {
        // Reload balances after successful burn
        await loadTokenData();
      } else {
        setError(result.error || 'Failed to burn tokens');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to burn tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawTokens = async (tokenAmount: string): Promise<TokenWithdrawResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenService.withdrawTokens(tokenAmount, address);
      
      if (result.success) {
        // Reload balances after successful withdrawal
        await loadTokenData();
      } else {
        setError(result.error || 'Failed to withdraw tokens');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to withdraw tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const fullFillTokens = async (ethAmount: string): Promise<TokenPurchaseResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenService.fullFillTokens(ethAmount);
      
      if (result.success) {
        // Reload balances after successful token fulfillment
        await loadTokenData();
      } else {
        setError(result.error || 'Failed to fulfill tokens');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fulfill tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const checkIsOwner = async (): Promise<boolean> => {
    try {
      return await tokenService.isOwner();
    } catch (err: any) {
      console.error('Error checking owner status:', err);
      return false;
    }
  };

  const refreshBalances = async () => {
    await loadTokenData();
  };

  return {
    // State
    balances,
    tokenInfo,
    priceInfo,
    isLoading,
    error,
    
    // Actions
    buyTokens,
    burnTokens,
    withdrawTokens,
    fullFillTokens,
    calculateBuyTokensCost,
    calculateWithdrawTokensNet,
    refreshBalances,
    checkIsOwner,
    
    // Computed values
    hasTokens: balances ? parseFloat(balances.balanceFormatted) > 0 : false,
    hasEth: balances ? parseFloat(balances.ethBalanceFormatted) > 0 : false,
  };
};
