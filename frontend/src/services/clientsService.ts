import { contractService } from './contractService';

export interface ClientData {
  clientAddress: string;
  companyId: string;
  totalPurchases: string;
  totalSpent: string;
  invoiceCount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientResult {
  success: boolean;
  message?: string;
  error?: string;
  transactionHash?: string;
}

class ClientsService {
  /**
   * Get all clients for a company
   */
  async getClientsByCompany(companyId: string): Promise<ClientData[]> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      const clients = await clientsContract.getClientsByCompany(companyId);
      
      return this.formatClientsArray(clients);
    } catch (error: any) {
      console.error('Error getting clients by company:', error);
      return [];
    }
  }

  /**
   * Get active clients for a company
   */
  async getActiveClientsByCompany(companyId: string): Promise<ClientData[]> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      const clients = await clientsContract.getActiveClientsByCompany(companyId);
      
      return this.formatClientsArray(clients);
    } catch (error: any) {
      console.error('Error getting active clients by company:', error);
      return [];
    }
  }

  /**
   * Get client information
   */
  async getClient(companyId: string, clientAddress: string): Promise<ClientData | null> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      const client = await clientsContract.getClient(companyId, clientAddress);
      
      return this.formatClientData(client);
    } catch (error: any) {
      console.error('Error getting client:', error);
      return null;
    }
  }

  /**
   * Deactivate a client
   */
  async deactivateClient(companyId: string, clientAddress: string): Promise<ClientResult> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      const tx = await clientsContract.deactivateClient(companyId, clientAddress, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Client deactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error deactivating client:', error);
      return {
        success: false,
        error: error.message || 'Failed to deactivate client',
      };
    }
  }

  /**
   * Reactivate a client
   */
  async reactivateClient(companyId: string, clientAddress: string): Promise<ClientResult> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      const tx = await clientsContract.reactivateClient(companyId, clientAddress, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        message: 'Client reactivated successfully!',
        transactionHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('Error reactivating client:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate client',
      };
    }
  }

  /**
   * Check if client exists
   */
  async clientExists(companyId: string, clientAddress: string): Promise<boolean> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        return false;
      }

      return await clientsContract.clientExists(companyId, clientAddress);
    } catch (error: any) {
      console.error('Error checking if client exists:', error);
      return false;
    }
  }

  /**
   * Check if client is active
   */
  async isClientActive(companyId: string, clientAddress: string): Promise<boolean> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        return false;
      }

      return await clientsContract.isClientActive(companyId, clientAddress);
    } catch (error: any) {
      console.error('Error checking if client is active:', error);
      return false;
    }
  }

  /**
   * Get client count for a company
   */
  async getClientCountByCompany(companyId: string): Promise<number> {
    try {
      const clientsContract = contractService.getContract('clients');
      
      if (!clientsContract) {
        return 0;
      }

      const count = await clientsContract.getClientCountByCompany(companyId);
      return parseInt(count.toString());
    } catch (error: any) {
      console.error('Error getting client count:', error);
      return 0;
    }
  }

  /**
   * Format client data from contract response
   */
  private formatClientData(client: any): ClientData {
    return {
      clientAddress: client.clientAddress,
      companyId: client.companyId.toString(),
      totalPurchases: client.totalPurchases.toString(),
      totalSpent: client.totalSpent.toString(),
      invoiceCount: client.invoiceCount.toString(),
      isActive: client.isActive,
      createdAt: new Date(parseInt(client.createdAt.toString()) * 1000).toISOString(),
      updatedAt: new Date(parseInt(client.updatedAt.toString()) * 1000).toISOString(),
    };
  }

  /**
   * Format clients array from contract response
   */
  private formatClientsArray(clients: any[]): ClientData[] {
    return clients.map(client => this.formatClientData(client));
  }
}

// Export singleton instance
export const clientsService = new ClientsService();
