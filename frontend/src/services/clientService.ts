import { ethers } from 'ethers';
import { contractService } from './contractService';

/**
 * Optimized service for client operations
 */
class ClientService {
  /**
   * Batch register client purchases for multiple companies (gas optimized)
   */
  async batchRegisterPurchases(
    userAddress: string,
    purchases: Array<{
      companyId: bigint;
      totalAmount: bigint;
    }>
  ): Promise<{success: boolean; gasUsed: number; errors: string[]}> {
    const errors: string[] = [];
    let totalGasUsed = 0;

    try {
      const clientsContract = contractService.getContract('clients');
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      console.log(`Batch registering ${purchases.length} company purchases...`);

      // Process each company purchase
      for (const purchase of purchases) {
        try {
          const tx = await clientsContract.registerClientPurchase(
            purchase.companyId,
            userAddress,
            purchase.totalAmount
          );
          
          const receipt = await tx.wait();
          totalGasUsed += receipt.gasUsed || 0;
          
          console.log(`✅ Company ${purchase.companyId}: ${ethers.formatEther(purchase.totalAmount)} ITC (Gas: ${receipt.gasUsed})`);
        } catch (error: any) {
          const errorMsg = `Company ${purchase.companyId}: ${error.message || 'Registration failed'}`;
          errors.push(errorMsg);
          console.warn('❌', errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        gasUsed: totalGasUsed,
        errors
      };

    } catch (error: any) {
      console.error('Batch registration error:', error);
      return {
        success: false,
        gasUsed: totalGasUsed,
        errors: [error.message || 'Batch registration failed']
      };
    }
  }

  /**
   * Check if user is already registered with a company (to avoid duplicate registrations)
   */
  async isUserRegisteredWithCompany(userAddress: string, companyId: number): Promise<boolean> {
    try {
      const clientsContract = contractService.getContract('clients');
      if (!clientsContract) {
        return false;
      }

      return await clientsContract.clientExists(companyId, userAddress);
    } catch (error) {
      console.error('Error checking client registration:', error);
      return false;
    }
  }

  /**
   * Get user's client statistics across all companies
   */
  async getUserClientStats(userAddress: string): Promise<{
    companiesCount: number;
    totalSpent: string;
    registrations: Array<{
      companyId: number;
      totalPurchase: string;
      invoiceCount: number;
      isActive: boolean;
    }>;
  }> {
    try {
      const clientsContract = contractService.getContract('clients');
      if (!clientsContract) {
        throw new Error('Clients contract not available');
      }

      // Get companies where user is registered
      const companyIds = await clientsContract.getClientCompanies(userAddress);
      const registrations = [];
      let totalSpent = 0n;

      for (const companyId of companyIds) {
        try {
          const clientData = await clientsContract.getClient(companyId, userAddress);
          registrations.push({
            companyId: parseInt(companyId.toString()),
            totalPurchase: ethers.formatEther(clientData.totalPurchase),
            invoiceCount: parseInt(clientData.invoiceCount.toString()),
            isActive: clientData.isActive
          });
          
          totalSpent += clientData.totalPurchase;
        } catch (error) {
          console.warn(`Error getting client data for company ${companyId}:`, error);
        }
      }

      return {
        companiesCount: registrations.length,
        totalSpent: ethers.formatEther(totalSpent),
        registrations
      };

    } catch (error) {
      console.error('Error getting user client stats:', error);
      return {
        companiesCount: 0,
        totalSpent: '0',
        registrations: []
      };
    }
  }

  /**
   * Estimate gas cost for client registration
   */
  async estimateRegistrationGas(
    userAddress: string,
    companyId: number,
    amount: bigint
  ): Promise<number> {
    try {
      const clientsContract = contractService.getContract('clients');
      if (!clientsContract) {
        return 0;
      }

      // Estimate gas for the registration call
      const gasEstimate = await clientsContract.registerClientPurchase.estimateGas(
        companyId,
        userAddress,
        amount
      );

      return parseInt(gasEstimate.toString());
    } catch (error) {
      console.error('Error estimating registration gas:', error);
      return 200000; // Conservative estimate
    }
  }
}

export const clientService = new ClientService();
