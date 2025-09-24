import { contractService } from './contractService';
import { formatEther } from 'ethers';

export interface BurnRecord {
  burnId: number;
  burner: string;
  amount: string;
  amountFormatted: string;
  timestamp: number;
  date: string;
}

export interface BurnStatistics {
  totalBurned: string;
  totalBurnedFormatted: string;
  totalTransactions: number;
  averageBurnAmount: string;
  averageBurnAmountFormatted: string;
}

class BurnHistoryService {
  /**
   * Get burn statistics from the contract
   */
  async getBurnStatistics(): Promise<BurnStatistics | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const [totalBurned, totalTransactions, averageBurnAmount] = await tokenContract.getBurnStatistics();

      return {
        totalBurned: totalBurned.toString(),
        totalBurnedFormatted: formatEther(totalBurned),
        totalTransactions: Number(totalTransactions),
        averageBurnAmount: averageBurnAmount.toString(),
        averageBurnAmountFormatted: formatEther(averageBurnAmount),
      };
    } catch (error: any) {
      console.error('Error getting burn statistics:', error);
      return null;
    }
  }

  /**
   * Get total number of burn transactions
   */
  async getTotalBurnTransactions(): Promise<number> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const total = await tokenContract.getTotalBurnTransactions();
      return Number(total);
    } catch (error: any) {
      console.error('Error getting total burn transactions:', error);
      return 0;
    }
  }

  /**
   * Get total amount of tokens burned
   */
  async getTotalTokensBurned(): Promise<string> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const total = await tokenContract.getTotalTokensBurned();
      return formatEther(total);
    } catch (error: any) {
      console.error('Error getting total tokens burned:', error);
      return '0';
    }
  }

  /**
   * Get a specific burn record by ID
   */
  async getBurnRecord(burnId: number): Promise<BurnRecord | null> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const [burner, amount, timestamp, id] = await tokenContract.getBurnRecord(burnId);

      return {
        burnId: Number(id),
        burner,
        amount: amount.toString(),
        amountFormatted: formatEther(amount),
        timestamp: Number(timestamp) * 1000, // Convert to milliseconds
        date: new Date(Number(timestamp) * 1000).toLocaleString(),
      };
    } catch (error: any) {
      console.error('Error getting burn record:', error);
      return null;
    }
  }

  /**
   * Get burn records in a range
   */
  async getBurnRecordsRange(start: number, end: number): Promise<BurnRecord[]> {
    try {
      const tokenContract = contractService.getContract('token');
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const [burners, amounts, timestamps, burnIds] = await tokenContract.getBurnRecordsRange(start, end);

      const records: BurnRecord[] = [];
      for (let i = 0; i < burners.length; i++) {
        records.push({
          burnId: Number(burnIds[i]),
          burner: burners[i],
          amount: amounts[i].toString(),
          amountFormatted: formatEther(amounts[i]),
          timestamp: Number(timestamps[i]) * 1000, // Convert to milliseconds
          date: new Date(Number(timestamps[i]) * 1000).toLocaleString(),
        });
      }

      return records;
    } catch (error: any) {
      console.error('Error getting burn records range:', error);
      return [];
    }
  }

  /**
   * Get all burn records (paginated)
   */
  async getAllBurnRecords(page: number = 0, pageSize: number = 50): Promise<BurnRecord[]> {
    try {
      const totalTransactions = await this.getTotalBurnTransactions();
      
      if (totalTransactions === 0) {
        return [];
      }

      // Calculate range for pagination (most recent first)
      const totalPages = Math.ceil(totalTransactions / pageSize);
      const currentPage = Math.min(page, totalPages - 1);
      
      // Convert to 0-based indexing for the contract
      const start = Math.max(0, totalTransactions - (currentPage + 1) * pageSize);
      const end = Math.min(totalTransactions, totalTransactions - currentPage * pageSize);

      if (start >= end) {
        return [];
      }

      const records = await this.getBurnRecordsRange(start, end);
      
      // Reverse to show most recent first
      return records.reverse();
    } catch (error: any) {
      console.error('Error getting all burn records:', error);
      return [];
    }
  }

  /**
   * Get recent burn records (last N records)
   */
  async getRecentBurnRecords(limit: number = 10): Promise<BurnRecord[]> {
    try {
      const totalTransactions = await this.getTotalBurnTransactions();
      
      if (totalTransactions === 0) {
        return [];
      }

      const start = Math.max(0, totalTransactions - limit);
      const records = await this.getBurnRecordsRange(start, totalTransactions);
      
      // Reverse to show most recent first
      return records.reverse();
    } catch (error: any) {
      console.error('Error getting recent burn records:', error);
      return [];
    }
  }

  /**
   * Get burn records for a specific address
   */
  async getBurnRecordsForAddress(address: string): Promise<BurnRecord[]> {
    try {
      const totalTransactions = await this.getTotalBurnTransactions();
      
      if (totalTransactions === 0) {
        return [];
      }

      // Get all records and filter by address
      // Note: This is not efficient for large numbers of records
      // In a production environment, you might want to add indexed events
      const allRecords = await this.getBurnRecordsRange(0, totalTransactions);
      
      return allRecords.filter(record => 
        record.burner.toLowerCase() === address.toLowerCase()
      ).reverse(); // Most recent first
    } catch (error: any) {
      console.error('Error getting burn records for address:', error);
      return [];
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}

export const burnHistoryService = new BurnHistoryService();
