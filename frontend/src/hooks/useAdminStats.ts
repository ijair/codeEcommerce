import { useState, useEffect, useCallback } from 'react';
import { adminStatsService, type AdminStats, type AdminStatsWithChanges } from '../services/adminStatsService';
import { useWallet } from './useWallet';
import { useContracts } from './useContracts';

export const useAdminStats = () => {
  const { isConnected } = useWallet();
  const { isInitialized } = useContracts();
  
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalTransactions: 0,
    totalRevenue: '0',
    activeUsers: 0,
    totalCompanies: 0,
    totalProducts: 0,
    maxTokenSupply: '1000000',
    smartContracts: 5
  });
  
  const [statsWithChanges, setStatsWithChanges] = useState<AdminStatsWithChanges | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load admin stats when wallet connects and contracts are initialized
  useEffect(() => {
    if (isConnected && isInitialized) {
      loadAdminStats();
    }
  }, [isConnected, isInitialized]);

  const loadAdminStats = useCallback(async () => {
    console.log('useAdminStats: Starting to load admin stats...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useAdminStats: Calling adminStatsService...');
      const [basicStats, statsWithChangesData] = await Promise.all([
        adminStatsService.getAdminStats(),
        adminStatsService.getAdminStatsWithChanges()
      ]);
      
      console.log('useAdminStats: Stats loaded:', basicStats);
      console.log('useAdminStats: Stats with changes loaded:', statsWithChangesData);
      
      setStats(basicStats);
      setStatsWithChanges(statsWithChangesData);
    } catch (err: any) {
      console.error('Error loading admin stats:', err);
      setError(err.message || 'Failed to load admin statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(() => {
    loadAdminStats();
  }, [loadAdminStats]);

  const getDetailedStats = useCallback(async () => {
    try {
      return await adminStatsService.getDetailedStats();
    } catch (err: any) {
      console.error('Error loading detailed stats:', err);
      return { salesByCompany: [], recentTransactions: [], topProducts: [] };
    }
  }, []);

  return {
    stats,
    statsWithChanges,
    isLoading,
    error,
    loadAdminStats,
    refreshStats,
    getDetailedStats,
  };
};

