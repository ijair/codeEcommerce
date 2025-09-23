import React, { useState } from 'react';
import WalletStatus from '../components/WalletStatus';
import AccessDenied from '../components/AccessDenied';
import CreateCompanyForm from '../components/CreateCompanyForm';
import CreateProductForm from '../components/CreateProductForm';
import { useWallet } from '../hooks/useWallet';
import { useAdmin } from '../hooks/useAdmin';
import { useCompanies } from '../hooks/useCompanies';
import { useProducts } from '../hooks/useProducts';
import { useAdminStats } from '../hooks/useAdminStats';

const Dashboard: React.FC = () => {
  const { isConnected } = useWallet();
  const { isAdmin, isLoading } = useAdmin();
  const { refreshCompanies } = useCompanies();
  const { refreshProducts } = useProducts();
  const { stats, statsWithChanges, isLoading: statsLoading, refreshStats } = useAdminStats();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'create-company' | 'create-product'>('overview');

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to access the admin dashboard
          </p>
        </div>
        <WalletStatus />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-primary-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-primary-200 rounded w-3/4"></div>
            <div className="h-4 bg-primary-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDenied
        title="Admin Access Required"
        message="This dashboard is restricted to platform administrators only."
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Manage the e-commerce platform and monitor blockchain operations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('create-company')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create-company'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Company
          </button>
          <button
            onClick={() => setActiveTab('create-product')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create-product'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Product
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Status */}
          <div className="lg:col-span-1">
            <WalletStatus />
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Admin Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('create-company')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Create Company</h4>
                      <p className="text-sm text-gray-600">Add new companies to the platform</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('create-product')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Create Product</h4>
                      <p className="text-sm text-gray-600">Add new products to companies</p>
                    </div>
                  </div>
                </button>

                <a
                  href="/companies"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Manage Companies</h4>
                      <p className="text-sm text-gray-600">View and manage all companies</p>
                    </div>
                  </div>
                </a>

                <a
                  href="/products"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Manage Products</h4>
                      <p className="text-sm text-gray-600">View and manage all products</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Platform Statistics
                </h3>
                <button
                  onClick={refreshStats}
                  disabled={statsLoading}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                >
                  {statsLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="animate-pulse bg-gray-200 h-8 rounded mb-2"></div>
                      <div className="animate-pulse bg-gray-200 h-4 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {stats.smartContracts}
                    </div>
                    <div className="text-sm text-gray-600">Smart Contracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stats.totalCompanies}
                    </div>
                    <div className="text-sm text-gray-600">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {stats.totalProducts}
                    </div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {parseInt(stats.maxTokenSupply).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Max Token Supply</div>
                  </div>
                </div>
              )}
            </div>

            {/* Business Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Business Statistics
              </h3>
              
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="animate-pulse bg-gray-200 h-8 rounded mb-2"></div>
                      <div className="animate-pulse bg-gray-200 h-4 rounded w-20 mx-auto mb-1"></div>
                      <div className="animate-pulse bg-gray-200 h-3 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {stats.totalSales}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Sales</div>
                    {statsWithChanges && statsWithChanges.totalSales.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.totalSales.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.totalSales.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>📊</span>
                        <span className="ml-1">
                          {statsWithChanges.totalSales.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.totalSales.change}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {stats.totalTransactions}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
                    {statsWithChanges && statsWithChanges.totalTransactions.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.totalTransactions.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.totalTransactions.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>💎</span>
                        <span className="ml-1">
                          {statsWithChanges.totalTransactions.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.totalTransactions.change}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {parseFloat(stats.totalRevenue).toFixed(2)} ETH
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Revenue (ETH)</div>
                    {statsWithChanges && statsWithChanges.totalRevenue.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.totalRevenue.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.totalRevenue.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>💰</span>
                        <span className="ml-1">
                          {statsWithChanges.totalRevenue.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.totalRevenue.change}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {stats.activeUsers}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Active Users</div>
                    {statsWithChanges && statsWithChanges.activeUsers.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.activeUsers.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.activeUsers.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>👥</span>
                        <span className="ml-1">
                          {statsWithChanges.activeUsers.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.activeUsers.change}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">
                      {stats.totalCompanies}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Companies</div>
                    {statsWithChanges && statsWithChanges.totalCompanies.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.totalCompanies.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.totalCompanies.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>🏢</span>
                        <span className="ml-1">
                          {statsWithChanges.totalCompanies.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.totalCompanies.change}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-1">
                      {stats.totalProducts}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Products</div>
                    {statsWithChanges && statsWithChanges.totalProducts.change !== 0 && (
                      <div className={`text-xs flex items-center justify-center ${
                        statsWithChanges.totalProducts.changeType === 'increase' 
                          ? 'text-green-600' 
                          : statsWithChanges.totalProducts.changeType === 'decrease'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <span>📦</span>
                        <span className="ml-1">
                          {statsWithChanges.totalProducts.changeType === 'increase' ? '+' : ''}
                          {statsWithChanges.totalProducts.change}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Company Tab */}
      {activeTab === 'create-company' && (
        <div className="max-w-2xl mx-auto">
          <CreateCompanyForm
            onSuccess={(result) => {
              console.log('Company created:', result);
              refreshCompanies();
              refreshStats();
              // Optionally switch back to overview tab
              setTimeout(() => setActiveTab('overview'), 2000);
            }}
          />
        </div>
      )}

      {/* Create Product Tab */}
      {activeTab === 'create-product' && (
        <div className="max-w-2xl mx-auto">
          <CreateProductForm
            onSuccess={(result) => {
              console.log('Product created:', result);
              refreshProducts();
              refreshStats();
              // Optionally switch back to overview tab
              setTimeout(() => setActiveTab('overview'), 2000);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
