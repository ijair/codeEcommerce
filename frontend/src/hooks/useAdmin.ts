import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { DEPLOYER_ADDRESS } from '../config/contracts';

export const useAdmin = () => {
  const { address, isConnected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      setIsLoading(true);
      
      if (!isConnected || !address) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if the connected address is the deployer/admin address
      const isAdminUser = address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();
      setIsAdmin(isAdminUser);
      setIsLoading(false);
    };

    checkAdminStatus();
  }, [address, isConnected]);

  return {
    isAdmin,
    isLoading,
    adminAddress: DEPLOYER_ADDRESS,
  };
};
