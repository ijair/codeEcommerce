import { useState, useEffect, useCallback } from 'react';
import { clientsService, type ClientData } from '../services/clientsService';
import { useWallet } from './useWallet';
import { useContracts } from './useContracts';
import { useCompanies } from './useCompanies';

export const useClients = () => {
  const { isConnected } = useWallet();
  const { isInitialized } = useContracts();
  const { companies } = useCompanies();
  
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Load clients when wallet connects, contracts are initialized, and company is selected
  useEffect(() => {
    if (isConnected && isInitialized && selectedCompanyId) {
      loadClientsByCompany(selectedCompanyId);
    }
  }, [isConnected, isInitialized, selectedCompanyId]);

  // Set first company as default when companies are loaded
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const loadClientsByCompany = useCallback(async (companyId: string) => {
    console.log('useClients: Loading clients for company:', companyId);
    setIsLoading(true);
    setError(null);
    
    try {
      const companyClients = await clientsService.getClientsByCompany(companyId);
      console.log('useClients: Clients loaded:', companyClients);
      
      setClients(companyClients);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveClientsByCompany = useCallback(async (companyId: string) => {
    console.log('useClients: Loading active clients for company:', companyId);
    setIsLoading(true);
    setError(null);
    
    try {
      const activeClients = await clientsService.getActiveClientsByCompany(companyId);
      console.log('useClients: Active clients loaded:', activeClients);
      
      setClients(activeClients);
    } catch (err: any) {
      console.error('Error loading active clients:', err);
      setError(err.message || 'Failed to load active clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deactivateClient = useCallback(async (companyId: string, clientAddress: string) => {
    setIsLoading(true);
    try {
      const result = await clientsService.deactivateClient(companyId, clientAddress);
      if (result.success) {
        // Reload clients after successful deactivation
        await loadClientsByCompany(companyId);
      }
      return result;
    } catch (err: any) {
      console.error('Error deactivating client:', err);
      return {
        success: false,
        error: err.message || 'Failed to deactivate client',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadClientsByCompany]);

  const reactivateClient = useCallback(async (companyId: string, clientAddress: string) => {
    setIsLoading(true);
    try {
      const result = await clientsService.reactivateClient(companyId, clientAddress);
      if (result.success) {
        // Reload clients after successful reactivation
        await loadClientsByCompany(companyId);
      }
      return result;
    } catch (err: any) {
      console.error('Error reactivating client:', err);
      return {
        success: false,
        error: err.message || 'Failed to reactivate client',
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadClientsByCompany]);

  const refreshClients = useCallback(() => {
    if (selectedCompanyId) {
      loadClientsByCompany(selectedCompanyId);
    }
  }, [selectedCompanyId, loadClientsByCompany]);

  const getClientCount = useCallback(async (companyId: string) => {
    try {
      return await clientsService.getClientCountByCompany(companyId);
    } catch (err: any) {
      console.error('Error getting client count:', err);
      return 0;
    }
  }, []);

  const getActiveClientCount = useCallback(() => {
    return clients.filter(client => client.isActive).length;
  }, [clients]);

  const getInactiveClientCount = useCallback(() => {
    return clients.filter(client => !client.isActive).length;
  }, [clients]);

  return {
    clients,
    isLoading,
    error,
    selectedCompanyId,
    setSelectedCompanyId,
    loadClientsByCompany,
    loadActiveClientsByCompany,
    deactivateClient,
    reactivateClient,
    refreshClients,
    getClientCount,
    getActiveClientCount,
    getInactiveClientCount,
  };
};
