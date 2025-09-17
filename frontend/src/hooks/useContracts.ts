import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { useWallet } from './useWallet';

export const useContracts = () => {
  const { provider, signer, network, isConnected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeContracts = async () => {
      if (!provider || !signer || !network || !isConnected) {
        setIsInitialized(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Determine network key
        const networkKey = network.chainId === 31337 ? 'local' : 'sepolia';
        
        // Initialize contract service
        await contractService.initialize(provider, signer, networkKey);
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Error initializing contracts:', err);
        setError(err.message || 'Failed to initialize contracts');
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContracts();
  }, [provider, signer, network, isConnected]);

  const getContract = (contractName: string): ethers.Contract | null => {
    return contractService.getContract(contractName);
  };

  const getContracts = () => {
    return contractService.getContracts();
  };

  return {
    isInitialized,
    isLoading,
    error,
    getContract,
    getContracts,
    contractService,
  };
};
