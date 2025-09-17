import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { checkoutService } from '../services/checkoutService';

const PurchaseHistory: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: '0',
    averageOrderValue: '0',
    lastPurchaseDate: null as string | null
  });
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadPurchaseHistory();
      loadStats();
    }
  }, [isConnected, address]);

  const loadPurchaseHistory = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const history = checkoutService.getUserPurchaseHistory(address);
      setPurchases(history);
    } catch (error) {
      console.error('Error loading purchase history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = () => {
    if (!address) return;
    
    const purchaseStats = checkoutService.getPurchaseStats(address);
    setStats(purchaseStats);
  };

  const handleViewDetails = (purchase: any) => {
    setSelectedPurchase(purchase);
  };

  const handleClearHistory = () => {
    if (!address) return;
    
    if (window.confirm('Are you sure you want to clear your purchase history? This action cannot be undone.')) {
      checkoutService.clearPurchaseHistory(address);
      setPurchases([]);
      loadStats();
    }
  };

  const formatTransactionHash = (hash: string): string => {
    if (!hash || hash === 'multiple_transactions') {
      return 'Multiple Transactions';
    }
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view your purchase history.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Purchase History</h1>
        <p className="text-lg text-gray-600">
          View your transaction history and purchase details
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Purchases</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-primary-600">{stats.totalSpent} ITC</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Average Order</div>
          <div className="text-2xl font-bold text-gray-900">{stats.averageOrderValue} ITC</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Last Purchase</div>
          <div className="text-lg font-medium text-gray-900">
            {stats.lastPurchaseDate || 'No purchases yet'}
          </div>
        </div>
      </div>

      {/* Purchase List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Purchases</h2>
          {purchases.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear History
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading purchase history...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start shopping to see your purchase history here.
              </p>
              <div className="mt-6">
                <a
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Browse Products
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(purchase)}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

export default PurchaseHistory;
