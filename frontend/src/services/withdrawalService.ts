// Service for handling withdrawal backend operations
export interface WithdrawalRecord {
  tokenAmount: string;
  withdrawalMethod: 'eth_wallet' | 'bank_transfer';
  destinationAddress?: string;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode: string;
  };
  userAddress: string;
  netAmount: string;
  fees: {
    stripeFee: string;
    gasFee: string;
  };
  transactionHash?: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface WithdrawalResponse {
  success: boolean;
  recordId?: string;
  message?: string;
  error?: string;
}

class WithdrawalService {
  // private readonly API_BASE_URL = process.env.VITE_API_BASE_URL || '/api'; // For future backend integration

  /**
   * Record a withdrawal request in the backend
   */
  async recordWithdrawal(withdrawalData: Omit<WithdrawalRecord, 'timestamp' | 'status'>): Promise<WithdrawalResponse> {
    try {
      const record: WithdrawalRecord = {
        ...withdrawalData,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      console.log('Recording withdrawal:', record);

      // For now, simulate a successful backend call
      // In a real implementation, this would make an HTTP request
      /*
      const response = await fetch(`${this.API_BASE_URL}/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
      */

      // Simulated successful response
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const recordId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in localStorage for demo purposes
      this.storeWithdrawalLocally(recordId, record);

      return {
        success: true,
        recordId,
        message: 'Withdrawal recorded successfully'
      };

    } catch (error: any) {
      console.error('Error recording withdrawal:', error);
      return {
        success: false,
        error: error.message || 'Failed to record withdrawal'
      };
    }
  }

  /**
   * Update withdrawal status (e.g., when blockchain transaction is confirmed)
   */
  async updateWithdrawalStatus(
    recordId: string, 
    status: WithdrawalRecord['status'], 
    transactionHash?: string
  ): Promise<WithdrawalResponse> {
    try {
      console.log(`Updating withdrawal ${recordId} to status: ${status}`, { transactionHash });

      // In a real implementation:
      /*
      const response = await fetch(`${this.API_BASE_URL}/withdrawals/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, transactionHash })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */

      // Simulated update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update in localStorage for demo
      this.updateWithdrawalLocally(recordId, { status, transactionHash });

      return {
        success: true,
        message: 'Withdrawal status updated successfully'
      };

    } catch (error: any) {
      console.error('Error updating withdrawal status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update withdrawal status'
      };
    }
  }

  /**
   * Get withdrawal history for a user
   */
  async getWithdrawalHistory(userAddress: string): Promise<WithdrawalRecord[]> {
    try {
      // In a real implementation:
      /*
      const response = await fetch(`${this.API_BASE_URL}/withdrawals?user=${userAddress}`, {
        headers: {
          // Add authentication headers if needed
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */

      // For demo, get from localStorage
      return this.getWithdrawalsFromLocalStorage(userAddress);

    } catch (error: any) {
      console.error('Error fetching withdrawal history:', error);
      return [];
    }
  }

  // Demo storage methods (replace with real backend in production)
  private storeWithdrawalLocally(recordId: string, record: WithdrawalRecord) {
    try {
      const existingWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '{}');
      existingWithdrawals[recordId] = record;
      localStorage.setItem('withdrawals', JSON.stringify(existingWithdrawals));
    } catch (error) {
      console.warn('Failed to store withdrawal locally:', error);
    }
  }

  private updateWithdrawalLocally(recordId: string, updates: Partial<WithdrawalRecord>) {
    try {
      const existingWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '{}');
      if (existingWithdrawals[recordId]) {
        existingWithdrawals[recordId] = { ...existingWithdrawals[recordId], ...updates };
        localStorage.setItem('withdrawals', JSON.stringify(existingWithdrawals));
      }
    } catch (error) {
      console.warn('Failed to update withdrawal locally:', error);
    }
  }

  private getWithdrawalsFromLocalStorage(userAddress: string): WithdrawalRecord[] {
    try {
      const existingWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '{}');
      return (Object.values(existingWithdrawals) as WithdrawalRecord[])
        .filter((record) => record.userAddress.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.warn('Failed to get withdrawals from localStorage:', error);
      return [];
    }
  }

  /**
   * Get withdrawal statistics for admin dashboard
   */
  async getWithdrawalStats(): Promise<{
    totalWithdrawals: number;
    totalAmount: string;
    pendingWithdrawals: number;
    completedWithdrawals: number;
  }> {
    try {
      // In a real implementation, this would be a backend API call
      const allWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '{}');
      const withdrawalArray = Object.values(allWithdrawals) as WithdrawalRecord[];

      const totalWithdrawals = withdrawalArray.length;
      const totalAmount = withdrawalArray
        .reduce((sum, w) => sum + parseFloat(w.tokenAmount), 0)
        .toFixed(2);
      const pendingWithdrawals = withdrawalArray.filter(w => w.status === 'pending').length;
      const completedWithdrawals = withdrawalArray.filter(w => w.status === 'completed').length;

      return {
        totalWithdrawals,
        totalAmount,
        pendingWithdrawals,
        completedWithdrawals,
      };
    } catch (error) {
      console.error('Error getting withdrawal stats:', error);
      return {
        totalWithdrawals: 0,
        totalAmount: '0',
        pendingWithdrawals: 0,
        completedWithdrawals: 0,
      };
    }
  }
}

export const withdrawalService = new WithdrawalService();
