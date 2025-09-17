import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useCompanies } from '../hooks/useCompanies';
import { useAdmin } from '../hooks/useAdmin';
import AccessDenied from '../components/AccessDenied';
import type { CompanyData } from '../services/companiesService';

const Companies: React.FC = () => {
  const { isConnected, address, connectWallet } = useWallet();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const {
    companies,
    isLoading,
    error,
    totalCount,
    refreshCompanies,
  } = useCompanies();

  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet to View Companies</h2>
        <p className="text-lg text-gray-600 mb-6">Please connect your MetaMask wallet to access the companies directory.</p>
        <button
          onClick={connectWallet}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isAdminLoading) {
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
        message="The companies directory is restricted to platform administrators only."
      />
    );
  }

  const handleViewDetails = (company: CompanyData) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Companies Directory</h1>
            <p className="text-lg text-gray-600">
              Manage companies on the decentralized platform
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <button
              onClick={refreshCompanies}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-6 text-sm text-gray-600">
          <span>Total Companies: {totalCount}</span>
          <span>Showing: {companies.length}</span>
          <span>Admin: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error: {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Companies Grid */}
      {!isLoading && (
        <>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">
                {totalCount === 0 
                  ? "No companies have been created yet." 
                  : "No companies match your current view."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {company.id}
                      </p>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span className="font-mono text-xs">
                        {company.owner.slice(0, 6)}...{company.owner.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(parseInt(company.createdAt) * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span>{new Date(parseInt(company.updatedAt) * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(company)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-md transition duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Company Details Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h2>
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company ID</label>
                  <p className="text-lg font-mono">{selectedCompany.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Owner Address</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {selectedCompany.owner}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCompany.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCompany.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(parseInt(selectedCompany.createdAt) * 1000).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm">{new Date(parseInt(selectedCompany.updatedAt) * 1000).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
