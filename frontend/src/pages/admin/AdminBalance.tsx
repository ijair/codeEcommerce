import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useTokens } from '../../hooks/useTokens';

/**
 * Admin Balance Page - Monitor contract balances and financial overview
 * Allows admin to view and manage platform finances
 */
const AdminBalance: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { balances, tokenInfo, fullFillTokens, checkIsOwner } = useTokens();

  const [ethAmount, setEthAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFullFillTokens = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) return;

    setIsProcessing(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const isOwner = await checkIsOwner();
      if (!isOwner) {
        throw new Error('Only contract owner can perform this action');
      }

      const result = await fullFillTokens(ethAmount);
      
      if (result.success) {
        setSuccessMessage(`Successfully added tokens! ETH sent: ${ethAmount} ETH. Transaction: ${result.transactionHash}`);
        setEthAmount('');
      } else {
        throw new Error(result.error || 'Failed to fulfill tokens');
      }
    } catch (err: any) {
      console.error('FullFill tokens error:', err);
      setErrorMessage(err.message || 'Failed to fulfill tokens');
    } finally {
      setIsProcessing(false);
    }
  };

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

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}

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
                  {tokenInfo ? (parseFloat(tokenInfo.totalSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Supply
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {tokenInfo ? (parseFloat(tokenInfo.maxSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Supply
              </label>
              <div className="text-lg font-semibold text-blue-600">
                {tokenInfo ? (parseFloat(tokenInfo.remainingSupply) / 1e18).toLocaleString() : 'Loading...'} ITC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Management</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Full Fill Tokens</h3>
              <div className="mt-2 text-sm text-blue-700">
                As the contract owner, you can add more tokens to your balance by sending ETH. 
                This will mint new tokens based on the current token price.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-700 mb-1">
              ETH Amount to Send
            </label>
            <input
              type="text"
              id="ethAmount"
              value={ethAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setEthAmount(value);
                }
              }}
              placeholder="Enter ETH amount (e.g., 1.5)"
              className="input-field"
              disabled={isProcessing}
            />
            <div className="mt-1 text-xs text-gray-500">
              This will mint tokens to your balance based on current token price
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={handleFullFillTokens}
              disabled={!ethAmount || parseFloat(ethAmount) <= 0 || isProcessing}
              className="btn-primary"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `Add Tokens (${ethAmount || '0'} ETH)`
              )}
            </button>
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
                `${((parseFloat(tokenInfo.totalSupply) / parseFloat(tokenInfo.maxSupply)) * 100).toFixed(1)}%`
                : '0.0%'}
            </div>
            <div className="text-sm text-gray-600">Supply Utilization</div>
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
