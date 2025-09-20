import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useTokens } from '../../hooks/useTokens';

/**
 * Admin Dashboard - Main control panel for system administrators
 * Provides access to all administrative functions
 */
const AdminDashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { balances, tokenInfo } = useTokens();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to access administrative functions
          </p>
        </div>
      </div>
    );
  }

  const dashboardOptions = [
    {
      title: 'Company Management',
      description: 'View and manage companies, track sales and products',
      icon: '🏢',
      link: '/admin/companies',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Site Statistics',
      description: 'View sales analytics and transaction summaries',
      icon: '📊',
      link: '/admin/statistics',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Site Management',
      description: 'Configure system settings and parameters',
      icon: '⚙️',
      link: '/admin/site-management',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Site Balance',
      description: 'Monitor contract balances and financial overview',
      icon: '💰',
      link: '/admin/balance',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'User Management',
      description: 'Manage users, permissions and access control',
      icon: '👥',
      link: '/admin/users',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Products Management',
      description: 'Oversee all products across companies',
      icon: '📦',
      link: '/admin/products',
      color: 'bg-red-50 border-red-200 hover:bg-red-100',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Welcome to the administrative control panel. Manage all aspects of the e-commerce platform.
        </p>
      </div>

      {/* Admin Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrator Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Address
            </label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {address}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ETH Balance
            </label>
            <div className="text-sm text-gray-900">
              {balances ? `${parseFloat(balances.ethBalanceFormatted).toFixed(4)} ETH` : 'Loading...'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ITC Token Balance
            </label>
            <div className="text-sm text-gray-900">
              {balances ? `${parseFloat(balances.balanceFormatted).toFixed(2)} ITC` : 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardOptions.map((option, index) => (
          <Link
            key={index}
            to={option.link}
            className={`block p-6 rounded-lg border-2 transition-all duration-200 ${option.color}`}
          >
            <div className="flex items-center mb-4">
              <div className={`text-2xl mr-3 ${option.iconColor}`}>
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {option.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {option.description}
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-gray-700">
              Access Panel
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/companies/create"
            className="btn-primary text-center"
          >
            + Create Company
          </Link>
          <Link
            to="/admin/products/create"
            className="btn-outline text-center"
          >
            + Add Product
          </Link>
          <Link
            to="/tokens"
            className="btn-outline text-center"
          >
            💰 Manage Tokens
          </Link>
          <Link
            to="/admin/statistics"
            className="btn-outline text-center"
          >
            📈 View Reports
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tokenInfo ? (parseFloat(tokenInfo.totalSupply) / 1e18).toLocaleString() : '0'}
            </div>
            <div className="text-sm text-gray-600">Total Tokens Issued</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tokenInfo ? (parseFloat(tokenInfo.remainingSupply) / 1e18).toLocaleString() : '0'}
            </div>
            <div className="text-sm text-gray-600">Tokens Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {tokenInfo ? `${tokenInfo.name} (${tokenInfo.symbol})` : 'Loading...'}
            </div>
            <div className="text-sm text-gray-600">Platform Token</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
