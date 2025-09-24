import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAdmin } from '../hooks/useAdmin';
import { NETWORKS } from '../services/walletService';

const Header: React.FC = () => {
  const {
    isConnected,
    address,
    balance,
    network,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const { isAdmin } = useAdmin();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    return `${parseFloat(bal).toFixed(4)} ETH`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              🛒 ITC E-commerce
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-primary-600 font-medium">
              Home
            </a>
            <a href="/products" className="text-gray-700 hover:text-primary-600 font-medium">
              Products
            </a>
            
            {/* Wallet-dependent Navigation - Only show when connected */}
            {isConnected && (
              <>
                {/* Admin Navigation */}
                {isAdmin ? (
                  <a href="/admin/dashboard" className="text-blue-700 hover:text-blue-800 font-medium">
                    🔧 Admin Dashboard
                  </a>
                ) : (
                  /* User Navigation */
                  <>
                    <a href="/my-balance" className="text-gray-700 hover:text-primary-600 font-medium">
                      My Balance
                    </a>
                    <a href="/tokens" className="text-gray-700 hover:text-primary-600 font-medium">
                      Buy Tokens
                    </a>
                    <a href="/purchases" className="text-gray-700 hover:text-primary-600 font-medium">
                      Purchase History
                    </a>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Selector */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                <select
                  value={network?.name || ''}
                  onChange={(e) => {
                    const networkKey = Object.keys(NETWORKS).find(
                      key => NETWORKS[key].name === e.target.value
                    );
                    if (networkKey) {
                      switchNetwork(networkKey);
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  disabled={isLoading}
                >
                  {Object.values(NETWORKS).map((net) => (
                    <option key={net.chainId} value={net.name}>
                      {net.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Wallet Info */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAddress(address!)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {balance && formatBalance(balance)}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  disabled={isLoading}
                  className="btn-outline text-sm"
                >
                  {isLoading ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Wallet Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Status */}
        {isConnected && network && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Connected to <strong>{network.name}</strong> (Chain ID: {network.chainId})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
