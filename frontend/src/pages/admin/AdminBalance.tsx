import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useTokens } from '../../hooks/useTokens';

/**
 * Admin Balance Page - Monitor contract balances and financial overview
 * Allows admin to view and manage platform finances
 */
const AdminBalance: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { balances, tokenInfo } = useTokens();



  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Site Balance</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to view platform balance information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Site Balance
            </h1>
            <p className="text-lg text-gray-600">
              Monitor and manage platform financial status
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


      {/* Admin Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Wallet</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                {address}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ETH Balance
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {balances ? `${parseFloat(balances.ethBalanceFormatted).toFixed(4)} ETH` : 'Loading...'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ITC Balance
                </label>
                <div className="text-lg font-semibold text-green-600">
                  {balances ? `${parseFloat(balances.balanceFormatted).toFixed(2)} ITC` : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Contract Info</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Supply
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {tokenInfo ? parseFloat(tokenInfo.totalSupplyFormatted).toLocaleString() : 'Loading...'} ITC
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Supply
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {tokenInfo ? parseFloat(tokenInfo.maxSupplyFormatted).toLocaleString() : 'Loading...'} ITC
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply Status
              </label>
              <div className="text-lg font-semibold text-green-600">
                {tokenInfo ? 'Fully Minted to Admin' : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Token Distribution Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Distribution Model</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How Token Distribution Works</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>• At deployment, all {tokenInfo ? parseFloat(tokenInfo.maxSupplyFormatted).toLocaleString() : '1,000,000'} ITC tokens were minted to your admin wallet</p>
                <p>• Users purchase tokens from your balance using ETH through the buyTokens function</p>
                <p>• Your current balance represents tokens available for sale to users</p>
                <p>• You can mint additional tokens by sending ETH (if under max supply)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Financial Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {balances ? `${parseFloat(balances.ethBalanceFormatted).toFixed(4)}` : '0.0000'}
            </div>
            <div className="text-sm text-gray-600">Admin ETH Balance</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {balances ? `${parseFloat(balances.balanceFormatted).toFixed(2)}` : '0.00'}
            </div>
            <div className="text-sm text-gray-600">Admin ITC Balance</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {tokenInfo ? 
                `${((parseFloat(tokenInfo.totalSupplyFormatted) / parseFloat(tokenInfo.maxSupplyFormatted)) * 100).toFixed(1)}%`
                : '0.0%'}
            </div>
            <div className="text-sm text-gray-600">Total Supply vs Max Supply</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <Link
          to="/tokens"
          className="btn-primary"
        >
          💰 Token Purchase Page
        </Link>
        <Link
          to="/admin/statistics"
          className="btn-outline"
        >
          📊 View Statistics
        </Link>
        <Link
          to="/admin/site-management"
          className="btn-outline"
        >
          ⚙️ Site Management
        </Link>
      </div>
    </div>
  );
};

export default AdminBalance;
