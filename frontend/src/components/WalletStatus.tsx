import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContracts } from '../hooks/useContracts';

const WalletStatus: React.FC = () => {
  const { 
    isConnected, 
    address, 
    balance, 
    network, 
    error: walletError,
    isLoading: walletLoading,
    connectWallet,
    switchNetwork 
  } = useWallet();
  
  const { 
    isInitialized, 
    isLoading: contractsLoading, 
    error: contractsError 
  } = useContracts();

  if (!isConnected) {
    return (
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
          <p className="text-gray-600 mb-6">
            Connect your MetaMask wallet to start using the ITC E-commerce platform
          </p>
          <button
            onClick={connectWallet}
            disabled={walletLoading}
            className="btn-primary w-full"
          >
            {walletLoading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Wallet Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {address}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Balance
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {balance} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Network Info Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Network Information
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Current Network
            </div>
            <div className="text-lg text-gray-900">
              {network?.name} (Chain ID: {network?.chainId})
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => switchNetwork('local')}
              disabled={walletLoading || network?.chainId === 31337}
              className={`px-3 py-1 text-xs rounded ${
                network?.chainId === 31337
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => switchNetwork('sepolia')}
              disabled={walletLoading || network?.chainId === 11155111}
              className={`px-3 py-1 text-xs rounded ${
                network?.chainId === 11155111
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sepolia
            </button>
          </div>
        </div>
      </div>

      {/* Contract Status Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Smart Contracts Status
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Contract Connection
            </div>
            <div className={`text-lg ${isInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {contractsLoading ? 'Initializing...' : isInitialized ? 'Connected' : 'Not Connected'}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            contractsLoading ? 'bg-yellow-400' : isInitialized ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
        </div>
        
        {contractsError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              {contractsError}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {walletError && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Wallet Error
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {walletError}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletStatus;
