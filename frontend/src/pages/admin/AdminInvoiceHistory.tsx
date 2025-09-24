import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useAdmin } from '../../hooks/useAdmin';

interface PurchaseData {
  id: string;
  date: number;
  transactionHash: string;
  totalAmount: string;
  totalAmountFormatted: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    companyId: string;
  }>;
  status: string;
  userAddress: string;
}

const AdminInvoiceHistory: React.FC = () => {
  const { isConnected } = useWallet();
  const { isAdmin } = useAdmin();
  const [allPurchases, setAllPurchases] = useState<PurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseData | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'high-value'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isConnected && isAdmin) {
      loadAllPurchases();
    }
  }, [isConnected, isAdmin]);

  const loadAllPurchases = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would fetch from a backend API
      // For now, we'll simulate loading all purchases from localStorage
      const purchases: PurchaseData[] = [];
      
      // Get all purchase history keys from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('purchase_history_')) {
          try {
            const userPurchases = JSON.parse(localStorage.getItem(key) || '[]');
            const userAddress = key.replace('purchase_history_', '');
            
            // Add user address to each purchase
            userPurchases.forEach((purchase: any) => {
              purchases.push({
                ...purchase,
                userAddress: userAddress
              });
            });
          } catch (error) {
            console.error('Error parsing purchase history for key:', key);
          }
        }
      }
      
      // Sort by date (newest first)
      purchases.sort((a, b) => b.date - a.date);
      setAllPurchases(purchases);
    } catch (error) {
      console.error('Error loading all purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTransactionHash = (hash: string): string => {
    if (!hash || hash === 'multiple_transactions') {
      return 'Multiple Transactions';
    }
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getFilteredPurchases = (): PurchaseData[] => {
    let filtered = allPurchases;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(purchase =>
        purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply date/value filters
    switch (filter) {
      case 'recent':
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(purchase => purchase.date > oneWeekAgo);
        break;
      case 'high-value':
        filtered = filtered.filter(purchase => parseFloat(purchase.totalAmountFormatted) > 10);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  };

  const getTotalStats = () => {
    const totalPurchases = allPurchases.length;
    const totalRevenue = allPurchases.reduce((sum, purchase) => 
      sum + parseFloat(purchase.totalAmountFormatted), 0
    );
    const averageOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
    const uniqueCustomers = new Set(allPurchases.map(p => p.userAddress)).size;

    return {
      totalPurchases,
      totalRevenue: totalRevenue.toFixed(6),
      averageOrderValue: averageOrderValue.toFixed(6),
      uniqueCustomers
    };
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access admin features.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to view invoice history.</p>
      </div>
    );
  }

  const stats = getTotalStats();
  const filteredPurchases = getFilteredPurchases();

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Invoice History</h1>
        <p className="text-lg text-gray-600">
          View all purchases and transactions across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Purchases</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-primary-600">{stats.totalRevenue} ITC</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Average Order</div>
          <div className="text-2xl font-bold text-gray-900">{stats.averageOrderValue} ITC</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Unique Customers</div>
          <div className="text-2xl font-bold text-gray-900">{stats.uniqueCustomers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Purchases</option>
                <option value="recent">Last 7 Days</option>
                <option value="high-value">High Value (&gt;10 ITC)</option>
              </select>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
              />
              <button
                onClick={loadAllPurchases}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            All Purchases ({filteredPurchases.length})
          </h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading purchase history...</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No purchases have been made yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPurchase(purchase)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Purchase #{purchase.id.slice(-6)}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {purchase.status || 'Completed'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Customer:</span>{' '}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {formatAddress(purchase.userAddress)}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(purchase.date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span>{' '}
                          {purchase.items?.length || 0}
                        </div>
                        <div>
                          <span className="font-medium">Transaction:</span>{' '}
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {formatTransactionHash(purchase.transactionHash)}
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {purchase.totalAmountFormatted} ITC
                      </div>
                      <button className="mt-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Purchase Details #{selectedPurchase.id.slice(-6)}
                </h2>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Purchase Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Customer Address</div>
                    <div className="text-lg text-gray-900 font-mono">{selectedPurchase.userAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Purchase Date</div>
                    <div className="text-lg text-gray-900">
                      {new Date(selectedPurchase.date).toLocaleDateString()} at{' '}
                      {new Date(selectedPurchase.date).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="text-lg text-gray-900 capitalize">{selectedPurchase.status || 'Completed'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Transaction Hash</div>
                    <div className="text-sm text-gray-900 font-mono">
                      {formatTransactionHash(selectedPurchase.transactionHash)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total Amount</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {selectedPurchase.totalAmountFormatted} ITC
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {selectedPurchase.items?.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Quantity: {item.quantity}</div>
                            <div>Unit Price: {item.unitPrice} ITC</div>
                            <div>Company ID: {item.companyId}</div>
                            <div>Product ID: {item.productId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {item.totalPrice} ITC
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoiceHistory;
