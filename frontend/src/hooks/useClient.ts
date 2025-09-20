import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { clientService } from '../services/clientService';

export const useClient = () => {
  const { isConnected, address } = useWallet();
  const [clientStats, setClientStats] = useState<{
    companiesCount: number;
    totalSpent: string;
    registrations: Array<{
      companyId: number;
      totalPurchase: string;
      invoiceCount: number;
      isActive: boolean;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadClientStats();
    } else {
      setClientStats(null);
    }
  }, [isConnected, address]);

  const loadClientStats = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await clientService.getUserClientStats(address);
      setClientStats(stats);
    } catch (err: any) {
      console.error('Error loading client stats:', err);
      setError(err.message || 'Failed to load client statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistration = async (companyId: number): Promise<boolean> => {
    if (!address) return false;
    
    try {
      return await clientService.isUserRegisteredWithCompany(address, companyId);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  };

  const estimateRegistrationGas = async (companyId: number, amount: string): Promise<number> => {
    if (!address) return 0;
    
    try {
      const amountBigInt = ethers.parseEther(amount);
      return await clientService.estimateRegistrationGas(address, companyId, amountBigInt);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return 200000; // Conservative estimate
    }
  };

  return {
    clientStats,
    isLoading,
    error,
    loadClientStats,
    checkRegistration,
    estimateRegistrationGas,
    // Computed properties
    isRegisteredCustomer: clientStats ? clientStats.companiesCount > 0 : false,
    totalCompanies: clientStats?.companiesCount || 0,
    totalSpent: clientStats?.totalSpent || '0'
  };
};
