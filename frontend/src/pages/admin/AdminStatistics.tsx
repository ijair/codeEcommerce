import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useTokens } from '../../hooks/useTokens';
import { adminStatsService } from '../../services/adminStatsService';

/**
 * Admin Statistics Page - View sales analytics and transaction summaries
 * Displays comprehensive statistics about the e-commerce platform
 */
const AdminStatistics: React.FC = () => {
  const { isConnected } = useWallet();
  const { tokenInfo, priceInfo } = useTokens();

  // Mock data - in production, fetch from contracts/backend
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalCompanies: 0,
    totalProducts: 0,
    tokensSold: 0,
    tokensWithdrawn: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        // Use the real admin stats service
        const realStats = await adminStatsService.getAdminStats();
        setStats({
          totalSales: realStats.totalSales,
          totalTransactions: realStats.totalTransactions,
          totalRevenue: parseFloat(realStats.totalRevenue),
          activeUsers: realStats.activeUsers,
          totalCompanies: realStats.totalCompanies,
          totalProducts: realStats.totalProducts,
          tokensSold: 0, // This would need to be calculated from token events
          tokensWithdrawn: 0 // This would need to be calculated from token events
        });
      } catch (error) {
        console.error('Error loading statistics:', error);
        // Set to zero values if there's an error
        setStats({
          totalSales: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          activeUsers: 0,
          totalCompanies: 0,
          totalProducts: 0,
          tokensSold: 0,
          tokensWithdrawn: 0
        });
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      loadStatistics();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Site Statistics</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to view platform statistics
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: '💰',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: '📊',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue (ETH)',
      value: `${stats.totalRevenue} ETH`,
      icon: '💎',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '👥',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-600',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: '🏢',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
      change: '+2',
      changeType: 'neutral'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      change: '+7',
      changeType: 'neutral'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Site Statistics
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive analytics and performance metrics
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="btn-outline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 ${stat.color}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-2xl ${stat.iconColor}`}>
                    {stat.icon}
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    stat.changeType === 'positive' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </h3>
                <p className="text-gray-600 text-sm">
                  {stat.title}
                </p>
              </div>
            ))}
          </div>

          {/* Token Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Analytics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tokens Sold</span>
                  <span className="font-semibold">{stats.tokensSold.toLocaleString()} ITC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tokens Withdrawn</span>
                  <span className="font-semibold">{stats.tokensWithdrawn.toLocaleString()} ITC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Net Tokens in Circulation</span>
                  <span className="font-semibold text-green-600">
                    {(stats.tokensSold - stats.tokensWithdrawn).toLocaleString()} ITC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Token Price</span>
                  <span className="font-semibold">
                    {priceInfo ? `${parseFloat(priceInfo.tokenPriceFormatted).toFixed(6)} ETH` : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Supply</span>
                  <span className="font-semibold">
                    {tokenInfo ? (parseFloat(tokenInfo.totalSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Supply</span>
                  <span className="font-semibold">
                    {tokenInfo ? (parseFloat(tokenInfo.maxSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining Supply</span>
                  <span className="font-semibold text-blue-600">
                    {tokenInfo ? (parseFloat(tokenInfo.remainingSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Supply Utilization</span>
                  <span className="font-semibold">
                    {tokenInfo ? 
                      `${((parseFloat(tokenInfo.totalSupply) / parseFloat(tokenInfo.maxSupply)) * 100).toFixed(1)}%`
                      : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Summary</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Today
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      This Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      This Month
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      New Sales
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Token Purchases
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0 ITC'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0 ITC'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0 ITC'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      New Users
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loading ? '...' : '0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/admin/companies"
              className="btn-primary"
            >
              View Companies
            </Link>
            <Link
              to="/admin/products"
              className="btn-outline"
            >
              Manage Products
            </Link>
            <Link
              to="/admin/balance"
              className="btn-outline"
            >
              Check Balance
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStatistics;
