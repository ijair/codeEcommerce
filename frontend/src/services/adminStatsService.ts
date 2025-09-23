import { ethers } from 'ethers';
import { contractService } from './contractService';

export interface AdminStats {
  totalSales: number;
  totalTransactions: number;
  totalRevenue: string; // in ETH
  activeUsers: number;
  totalCompanies: number;
  totalProducts: number;
  maxTokenSupply: string;
  smartContracts: number;
}

export interface StatChange {
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

export interface AdminStatsWithChanges {
  totalSales: StatChange;
  totalTransactions: StatChange;
  totalRevenue: StatChange;
  activeUsers: StatChange;
  totalCompanies: StatChange;
  totalProducts: StatChange;
}

class AdminStatsService {
  /**
   * Get comprehensive admin statistics from blockchain
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        totalSales,
        totalTransactions,
        totalRevenue,
        activeUsers,
        totalCompanies,
        totalProducts,
        maxTokenSupply
      ] = await Promise.all([
        this.getTotalSales(),
        this.getTotalTransactions(),
        this.getTotalRevenue(),
        this.getActiveUsers(),
        this.getTotalCompanies(),
        this.getTotalProducts(),
        this.getMaxTokenSupply()
      ]);

      const result = {
        totalSales,
        totalTransactions,
        totalRevenue,
        activeUsers,
        totalCompanies,
        totalProducts,
        maxTokenSupply,
        smartContracts: 5 // Fixed number of smart contracts
      };
      
      console.log('AdminStats: Final statistics result:', result);
      return result;
    } catch (error: any) {
      console.error('Error getting admin stats:', error);
      // Return default values if there's an error
      return {
        totalSales: 0,
        totalTransactions: 0,
        totalRevenue: '0',
        activeUsers: 0,
        totalCompanies: 0,
        totalProducts: 0,
        maxTokenSupply: '1000000',
        smartContracts: 5
      };
    }
  }

  /**
   * Get total sales count from all invoices
   */
  private async getTotalSales(): Promise<number> {
    try {
      const invoiceContract = contractService.getContract('invoice');
      if (!invoiceContract) {
        console.warn('Invoice contract not available');
        return 0;
      }

      const invoices = await invoiceContract.getAllInvoices();
      console.log('AdminStats: All invoices:', invoices);
      // Count only paid invoices as sales
      const paidInvoices = invoices.filter((invoice: any) => invoice.isPaid);
      console.log('AdminStats: Paid invoices count:', paidInvoices.length);
      return paidInvoices.length;
    } catch (error) {
      console.error('Error getting total sales:', error);
      return 0;
    }
  }

  /**
   * Get total transactions count (all invoices + token purchases)
   */
  private async getTotalTransactions(): Promise<number> {
    try {
      const invoiceContract = contractService.getContract('invoice');
      
      if (!invoiceContract) {
        console.warn('Invoice contract not available');
        return 0;
      }

      const invoices = await invoiceContract.getAllInvoices();
      const invoiceCount = invoices.length;
      console.log('AdminStats: Total invoices count:', invoiceCount);

      // For token transactions, we would need to query events or use a different approach
      // For now, we'll use invoice count as a proxy for transactions
      return invoiceCount;
    } catch (error) {
      console.error('Error getting total transactions:', error);
      return 0;
    }
  }

  /**
   * Get total revenue in ETH (sum of all paid invoices converted to ETH)
   */
  private async getTotalRevenue(): Promise<string> {
    try {
      const invoiceContract = contractService.getContract('invoice');
      if (!invoiceContract) return '0';

      const invoices = await invoiceContract.getAllInvoices();
      let totalRevenue = 0n;

      // Sum up all paid invoices
      for (const invoice of invoices) {
        if (invoice.isPaid) {
          totalRevenue += BigInt(invoice.totalAmount);
        }
      }

      // Convert from wei to ETH (assuming token amounts are in wei)
      return ethers.formatEther(totalRevenue);
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return '0';
    }
  }

  /**
   * Get count of active users (unique clients across all companies)
   */
  private async getActiveUsers(): Promise<number> {
    try {
      const clientsContract = contractService.getContract('clients');
      const companyContract = contractService.getContract('company');
      
      if (!clientsContract || !companyContract) return 0;

      const companies = await companyContract.getAllCompanies();
      const uniqueClients = new Set<string>();

      // Get all unique clients from all companies
      for (const company of companies) {
        try {
          const companyId = companies.indexOf(company);
          const clients = await clientsContract.getActiveClientsByCompany(companyId);
          
          for (const client of clients) {
            if (client.isActive) {
              uniqueClients.add(client.clientAddress);
            }
          }
        } catch (error) {
          console.warn(`Error getting clients for company ${companies.indexOf(company)}:`, error);
        }
      }

      return uniqueClients.size;
    } catch (error) {
      console.error('Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Get total companies count
   */
  private async getTotalCompanies(): Promise<number> {
    try {
      const companyContract = contractService.getContract('company');
      if (!companyContract) {
        console.warn('Company contract not available');
        return 0;
      }

      const count = await companyContract.getCompanyCount();
      const countNumber = parseInt(count.toString());
      console.log('AdminStats: Company count from contract:', countNumber);
      return countNumber;
    } catch (error) {
      console.error('Error getting total companies:', error);
      return 0;
    }
  }

  /**
   * Get total products count
   */
  private async getTotalProducts(): Promise<number> {
    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        console.warn('Products contract not available');
        return 0;
      }

      const count = await productsContract.getProductCount();
      const countNumber = parseInt(count.toString());
      console.log('AdminStats: Product count from contract:', countNumber);
      return countNumber;
    } catch (error) {
      console.error('Error getting total products:', error);
      return 0;
    }
  }

  /**
   * Get max token supply
   */
  private async getMaxTokenSupply(): Promise<string> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) return '1000000';

      const maxSupply = await tokenContract.getMaxSupply();
      return ethers.formatEther(maxSupply);
    } catch (error) {
      console.error('Error getting max token supply:', error);
      return '1000000';
    }
  }

  /**
   * Get statistics with change indicators
   * For now, we'll show neutral changes since we don't have historical data
   */
  async getAdminStatsWithChanges(): Promise<AdminStatsWithChanges> {
    const currentStats = await this.getAdminStats();
    
    // Since we don't have historical data yet, show neutral changes
    // In production, you would compare with previous period data
    return {
      totalSales: {
        value: currentStats.totalSales,
        change: 0,
        changeType: 'neutral'
      },
      totalTransactions: {
        value: currentStats.totalTransactions,
        change: 0,
        changeType: 'neutral'
      },
      totalRevenue: {
        value: `${parseFloat(currentStats.totalRevenue).toFixed(2)} ETH`,
        change: 0,
        changeType: 'neutral'
      },
      activeUsers: {
        value: currentStats.activeUsers,
        change: 0,
        changeType: 'neutral'
      },
      totalCompanies: {
        value: currentStats.totalCompanies,
        change: 0,
        changeType: 'neutral'
      },
      totalProducts: {
        value: currentStats.totalProducts,
        change: 0,
        changeType: 'neutral'
      }
    };
  }

  /**
   * Get detailed breakdown of statistics
   */
  async getDetailedStats(): Promise<{
    salesByCompany: Array<{companyName: string; sales: number; revenue: string}>;
    recentTransactions: Array<{id: string; amount: string; date: string; company: string}>;
    topProducts: Array<{name: string; sales: number; revenue: string}>;
  }> {
    try {
      const companyContract = contractService.getContract('company');
      const productsContract = contractService.getContract('products');
      const invoiceContract = contractService.getContract('invoice');
      
      if (!companyContract || !productsContract || !invoiceContract) {
        return { salesByCompany: [], recentTransactions: [], topProducts: [] };
      }

      const [companies, invoices] = await Promise.all([
        companyContract.getAllCompanies(),
        invoiceContract.getAllInvoices()
      ]);

      // Calculate sales by company
      const salesByCompany = companies.map((company: any, index: number) => {
        const companyInvoices = invoices.filter((invoice: any) => 
          invoice.companyId === index && invoice.isPaid
        );
        const sales = companyInvoices.length;
        const revenue = companyInvoices.reduce((sum: bigint, invoice: any) => 
          sum + BigInt(invoice.totalAmount), 0n
        );
        
        return {
          companyName: company.name,
          sales,
          revenue: ethers.formatEther(revenue)
        };
      }).filter((item: any) => item.sales > 0);

      // Get recent transactions (last 10)
      const recentTransactions = invoices
        .filter((invoice: any) => invoice.isPaid)
        .sort((a: any, b: any) => parseInt(b.createdAt) - parseInt(a.createdAt))
        .slice(0, 10)
        .map((invoice: any) => {
          const company = companies[invoice.companyId];
          return {
            id: invoice.id.toString(),
            amount: ethers.formatEther(invoice.totalAmount),
            date: new Date(parseInt(invoice.createdAt) * 1000).toLocaleDateString(),
            company: company ? company.name : 'Unknown'
          };
        });

      return {
        salesByCompany,
        recentTransactions,
        topProducts: [] // Would need more complex logic to track product sales
      };
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      return { salesByCompany: [], recentTransactions: [], topProducts: [] };
    }
  }
}

// Export singleton instance
export const adminStatsService = new AdminStatsService();
