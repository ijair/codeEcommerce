import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { DEPLOYER_ADDRESS } from '../config/contracts';

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Access Denied",
  message = "You don't have permission to access this page."
}) => {
  const { address, connectWallet, isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">{message}</p>
        </div>

        <div className="space-y-4">
          {!isConnected ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">Please connect your wallet to continue</p>
              <button
                onClick={connectWallet}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Address:</p>
                <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                  {address}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-2">Admin Address Required:</p>
                <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                  {DEPLOYER_ADDRESS}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Only the platform administrator can access this area.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <a
            href="/"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
