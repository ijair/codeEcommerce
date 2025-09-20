import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useTokens } from '../../hooks/useTokens';

/**
 * Admin Site Management Page - Configure system settings and parameters
 * Allows admin to manage platform configuration and settings
 */
const AdminSiteManagement: React.FC = () => {
  const { isConnected } = useWallet();
  const { priceInfo } = useTokens();

  const [settings, setSettings] = useState({
    tokenPrice: '',
    stripeFeeFixed: '',
    stripeFeePercentage: '',
    gasFeeEstimate: '',
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxTransactionAmount: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load current settings
  React.useEffect(() => {
    if (priceInfo) {
      setSettings(prev => ({
        ...prev,
        tokenPrice: priceInfo.tokenPriceFormatted || '',
        stripeFeeFixed: (parseFloat(priceInfo.stripeFeeConfig.fixedFee) / 1e18).toString() || '',
        stripeFeePercentage: (parseFloat(priceInfo.stripeFeeConfig.percentageFee) / 100).toString() || '',
        gasFeeEstimate: (parseFloat(priceInfo.gasFeeEstimate) / 1e18).toString() || ''
      }));
    }
  }, [priceInfo]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // In production, save settings to smart contract
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSuccessMessage('Settings saved successfully!');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Site Management</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to access site management functions
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
              Site Management
            </h1>
            <p className="text-lg text-gray-600">
              Configure system settings and platform parameters
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

      <div className="space-y-8">
        {/* Token Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tokenPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Token Price (ETH)
              </label>
              <input
                type="text"
                id="tokenPrice"
                value={settings.tokenPrice}
                onChange={(e) => setSettings(prev => ({ ...prev, tokenPrice: e.target.value }))}
                className="input-field"
                placeholder="0.001"
              />
              <p className="mt-1 text-xs text-gray-500">Price per token in ETH</p>
            </div>
            <div>
              <label htmlFor="maxTransactionAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Max Transaction Amount (ITC)
              </label>
              <input
                type="text"
                id="maxTransactionAmount"
                value={settings.maxTransactionAmount}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTransactionAmount: e.target.value }))}
                className="input-field"
                placeholder="10000"
              />
              <p className="mt-1 text-xs text-gray-500">Maximum tokens per transaction</p>
            </div>
          </div>
        </div>

        {/* Fee Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="stripeFeeFixed" className="block text-sm font-medium text-gray-700 mb-1">
                Stripe Fixed Fee (ETH)
              </label>
              <input
                type="text"
                id="stripeFeeFixed"
                value={settings.stripeFeeFixed}
                onChange={(e) => setSettings(prev => ({ ...prev, stripeFeeFixed: e.target.value }))}
                className="input-field"
                placeholder="0.0001"
              />
              <p className="mt-1 text-xs text-gray-500">Fixed fee in ETH</p>
            </div>
            <div>
              <label htmlFor="stripeFeePercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Stripe Percentage Fee (%)
              </label>
              <input
                type="text"
                id="stripeFeePercentage"
                value={settings.stripeFeePercentage}
                onChange={(e) => setSettings(prev => ({ ...prev, stripeFeePercentage: e.target.value }))}
                className="input-field"
                placeholder="2.9"
              />
              <p className="mt-1 text-xs text-gray-500">Percentage fee (e.g., 2.9)</p>
            </div>
            <div>
              <label htmlFor="gasFeeEstimate" className="block text-sm font-medium text-gray-700 mb-1">
                Gas Fee Estimate (ETH)
              </label>
              <input
                type="text"
                id="gasFeeEstimate"
                value={settings.gasFeeEstimate}
                onChange={(e) => setSettings(prev => ({ ...prev, gasFeeEstimate: e.target.value }))}
                className="input-field"
                placeholder="0.002"
              />
              <p className="mt-1 text-xs text-gray-500">Estimated gas fee</p>
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-500">Temporarily disable platform access for maintenance</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.maintenanceMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Allow New Registrations</h3>
                <p className="text-sm text-gray-500">Allow new users to register and create accounts</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, allowNewRegistrations: !prev.allowNewRegistrations }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.allowNewRegistrations ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.allowNewRegistrations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Platform Version</h3>
              <p className="text-sm text-gray-900">v1.0.0</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h3>
              <p className="text-sm text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Network</h3>
              <p className="text-sm text-gray-900">Local Development</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <p className="text-sm text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="btn-primary px-8 py-3"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Settings...
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/admin/balance"
              className="btn-outline text-center"
            >
              💰 View Balance
            </Link>
            <Link
              to="/admin/statistics"
              className="btn-outline text-center"
            >
              📊 Statistics
            </Link>
            <Link
              to="/admin/companies"
              className="btn-outline text-center"
            >
              🏢 Companies
            </Link>
            <Link
              to="/admin/users"
              className="btn-outline text-center"
            >
              👥 Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSiteManagement;
