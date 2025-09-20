import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useTokens } from '../hooks/useTokens';

/**
 * My Balance Page - User's personal balance and token information
 * Displays user's ETH and ITC token balances with quick actions
 */
const MyBalance: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { balances, tokenInfo, priceInfo, isLoading, hasTokens, hasEth } = useTokens();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Balance</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to view your balance information
          </p>
          <div className="card max-w-md mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600">
                Please connect your wallet to view your balance information
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          My Balance
        </h1>
        <p className="text-lg text-gray-600">
          View your wallet balance and token information
        </p>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded break-all">
              {address}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ETH Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">ETH Balance</h3>
            <div className="text-2xl">⚡</div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-blue-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-blue-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {balances ? parseFloat(balances.ethBalanceFormatted).toFixed(4) : '0.0000'} ETH
              </div>
              <div className="text-sm text-blue-700">
                Available for transactions and gas fees
              </div>
            </div>
          )}
        </div>

        {/* ITC Token Balance */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">ITC Token Balance</h3>
            <div className="text-2xl">🪙</div>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-green-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-green-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold text-green-900 mb-2">
                {balances ? parseFloat(balances.balanceFormatted).toFixed(2) : '0.00'} ITC
              </div>
              <div className="text-sm text-green-700">
                Platform tokens for purchases
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Name
                </label>
                <div className="text-sm text-gray-900">
                  {tokenInfo ? `${tokenInfo.name} (${tokenInfo.symbol})` : 'Loading...'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Price
                </label>
                <div className="text-sm text-gray-900">
                  {priceInfo ? `${parseFloat(priceInfo.tokenPriceFormatted).toFixed(6)} ETH per ITC` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Supply
                </label>
                <div className="text-sm text-gray-900">
                  {tokenInfo ? (parseFloat(tokenInfo.totalSupply) / 1e18).toLocaleString() + ' ITC' : 'Loading...'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Holdings
                </label>
                <div className="text-sm text-gray-900">
                  {tokenInfo && balances ? 
                    `${((parseFloat(balances.balance) / parseFloat(tokenInfo.totalSupply)) * 100).toFixed(4)}% of total supply`
                    : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border-2 ${hasEth ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <div className={`text-2xl mr-3 ${hasEth ? 'text-green-600' : 'text-red-600'}`}>
                {hasEth ? '✅' : '❌'}
              </div>
              <div>
                <h3 className={`font-semibold ${hasEth ? 'text-green-900' : 'text-red-900'}`}>
                  ETH for Gas Fees
                </h3>
                <p className={`text-sm ${hasEth ? 'text-green-700' : 'text-red-700'}`}>
                  {hasEth ? 'You have ETH for transactions' : 'You need ETH for gas fees'}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${hasTokens ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center">
              <div className={`text-2xl mr-3 ${hasTokens ? 'text-green-600' : 'text-yellow-600'}`}>
                {hasTokens ? '✅' : '⚠️'}
              </div>
              <div>
                <h3 className={`font-semibold ${hasTokens ? 'text-green-900' : 'text-yellow-900'}`}>
                  ITC Tokens
                </h3>
                <p className={`text-sm ${hasTokens ? 'text-green-700' : 'text-yellow-700'}`}>
                  {hasTokens ? 'You have tokens for purchases' : 'Buy tokens to make purchases'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tokens"
            className="btn-primary text-center"
          >
            🪙 Buy Tokens
          </Link>
          <Link
            to="/withdraw"
            className={`text-center ${hasTokens ? 'btn-outline' : 'btn-disabled'}`}
            {...(!hasTokens && { onClick: (e) => e.preventDefault() })}
          >
            💸 Withdraw Tokens
          </Link>
          <Link
            to="/products"
            className="btn-outline text-center"
          >
            🛒 Shop Products
          </Link>
        </div>
        
        {!hasTokens && (
          <div className="mt-4 text-center text-sm text-gray-600">
            You need ITC tokens to make purchases or withdrawals. 
            <Link to="/tokens" className="text-primary-600 hover:text-primary-800 font-medium ml-1">
              Buy tokens now →
            </Link>
          </div>
        )}
      </div>

      {/* Value Summary */}
      {balances && priceInfo && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {parseFloat(balances.ethBalanceFormatted).toFixed(4)} ETH
              </div>
              <div className="text-sm text-gray-600">ETH Holdings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {parseFloat(balances.balanceFormatted).toFixed(2)} ITC
              </div>
              <div className="text-sm text-gray-600">Token Holdings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {((parseFloat(balances.balance) / 1e18) * parseFloat(priceInfo.tokenPriceFormatted)).toFixed(6)} ETH
              </div>
              <div className="text-sm text-gray-600">Token Value in ETH</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBalance;
