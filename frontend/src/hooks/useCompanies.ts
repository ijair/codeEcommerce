import { useState, useEffect, useCallback } from 'react';
import { companiesService, type CompanyData } from '../services/companiesService';
import { useWallet } from './useWallet';
import { useContracts } from './useContracts';

export const useCompanies = () => {
  const { isConnected } = useWallet();
  const { isInitialized } = useContracts();
  
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load companies when wallet connects and contracts are initialized
  useEffect(() => {
    if (isConnected && isInitialized) {
      loadAllCompanies();
    }
  }, [isConnected, isInitialized]);

  const loadAllCompanies = useCallback(async () => {
    console.log('useCompanies: Starting to load all companies...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useCompanies: Calling companiesService...');
      const [allCompanies, companyCount] = await Promise.all([
        companiesService.getAllCompanies(),
        companiesService.getCompanyCount(),
      ]);
      
      console.log('useCompanies: Companies loaded:', allCompanies);
      console.log('useCompanies: Company count:', companyCount);
      
      setCompanies(allCompanies);
      setTotalCount(companyCount);
    } catch (err: any) {
      console.error('Error loading companies:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const activeCompanies = await companiesService.getActiveCompanies();
      setCompanies(activeCompanies);
    } catch (err: any) {
      console.error('Error loading active companies:', err);
      setError(err.message || 'Failed to load active companies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCompaniesByOwner = useCallback(async (ownerAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const ownerCompanies = await companiesService.getCompaniesByOwner(ownerAddress);
      setCompanies(ownerCompanies);
    } catch (err: any) {
      console.error('Error loading companies by owner:', err);
      setError(err.message || 'Failed to load companies by owner');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCompany = useCallback(async (name: string) => {
    setIsLoading(true);
    try {
      const result = await companiesService.createCompany({ name });
      if (result.success) {
        // Reload companies after successful creation
        await loadAllCompanies();
      }
      return result;
    } catch (err: any) {
      console.error('Error creating company:', err);
      return {
        success: false,
        message: 'Failed to create company',
        error: err.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompanies]);

  const createCompanyForOwner = useCallback(async (name: string, ownerAddress: string) => {
    setIsLoading(true);
    try {
      const result = await companiesService.createCompanyForOwner(name, ownerAddress);
      if (result.success) {
        // Reload companies after successful creation
        await loadAllCompanies();
      }
      return result;
    } catch (err: any) {
      console.error('Error creating company for owner:', err);
      return {
        success: false,
        message: 'Failed to create company',
        error: err.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompanies]);

  const updateCompany = useCallback(async (companyId: string, name: string) => {
    setIsLoading(true);
    try {
      const result = await companiesService.updateCompany({ companyId, name });
      if (result.success) {
        // Reload companies after successful update
        await loadAllCompanies();
      }
      return result;
    } catch (err: any) {
      console.error('Error updating company:', err);
      return {
        success: false,
        message: 'Failed to update company',
        error: err.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompanies]);

  const deactivateCompany = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      const result = await companiesService.deactivateCompany(companyId);
      if (result.success) {
        // Reload companies after successful deactivation
        await loadAllCompanies();
      }
      return result;
    } catch (err: any) {
      console.error('Error deactivating company:', err);
      return {
        success: false,
        message: 'Failed to deactivate company',
        error: err.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompanies]);

  const reactivateCompany = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      const result = await companiesService.reactivateCompany(companyId);
      if (result.success) {
        // Reload companies after successful reactivation
        await loadAllCompanies();
      }
      return result;
    } catch (err: any) {
      console.error('Error reactivating company:', err);
      return {
        success: false,
        message: 'Failed to reactivate company',
        error: err.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompanies]);

  const isCompanyOwner = useCallback(async (companyId: string, userAddress: string) => {
    try {
      return await companiesService.isCompanyOwner(companyId, userAddress);
    } catch (err: any) {
      console.error('Error checking company ownership:', err);
      return false;
    }
  }, []);

  const refreshCompanies = useCallback(() => {
    loadAllCompanies();
  }, [loadAllCompanies]);

  return {
    companies,
    isLoading,
    error,
    totalCount,
    loadAllCompanies,
    loadActiveCompanies,
    loadCompaniesByOwner,
    createCompany,
    createCompanyForOwner,
    updateCompany,
    deactivateCompany,
    reactivateCompany,
    isCompanyOwner,
    refreshCompanies,
  };
};
