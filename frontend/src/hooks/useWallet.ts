import { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';
import type { WalletState } from '../types/contracts';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    network: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe(setWalletState);

    // Check if already connected on mount
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        // First check if MetaMask is available
        if (walletService.isMetaMaskInstalled()) {
          // Check if user manually disconnected
          const userDisconnected = localStorage.getItem('wallet-disconnected') === 'true';
          
          if (userDisconnected) {
            // User manually disconnected, don't auto-connect
            setWalletState({
              isConnected: false,
              address: null,
              balance: null,
              network: null,
              error: null,
            });
            return;
          }

          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            // Already connected, get wallet state
            const state = await walletService.connectWallet();
            setWalletState(state);
          } else {
            // Not connected
            setWalletState({
              isConnected: false,
              address: null,
              balance: null,
              network: null,
              error: null,
            });
          }
        } else {
          setWalletState({
            isConnected: false,
            address: null,
            balance: null,
            network: null,
            error: 'MetaMask is not installed',
          });
        }
      } catch (error: any) {
        console.error('Error checking wallet connection:', error);
        setWalletState({
          isConnected: false,
          address: null,
          balance: null,
          network: null,
          error: error.message || 'Failed to check wallet connection',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Clear the disconnected flag when user manually connects
      localStorage.removeItem('wallet-disconnected');
      await walletService.connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    try {
      // Set the disconnected flag to prevent auto-reconnection
      localStorage.setItem('wallet-disconnected', 'true');
      await walletService.disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = async (networkKey: string) => {
    setIsLoading(true);
    try {
      await walletService.switchNetwork(networkKey);
    } catch (error) {
      console.error('Error switching network:', error);
      setWalletState(prev => ({
        ...prev,
        error: `Failed to switch network: ${error}`,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...walletState,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    provider: walletService.getProvider(),
    signer: walletService.getSigner(),
  };
};
