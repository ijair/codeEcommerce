import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useAdmin } from '../../hooks/useAdmin';
import { useCompanies } from '../../hooks/useCompanies';
import AccessDenied from '../../components/AccessDenied';
import type { CompanyResult } from '../../services/companiesService';

const CreateCompany: React.FC = () => {
  const { isConnected } = useWallet();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { createCompanyForOwner, isLoading } = useCompanies();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<CompanyResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-lg text-gray-600 mb-8">
            Please connect your MetaMask wallet to create companies.
          </p>
        </div>
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
        message="This page is restricted to platform administrators only."
      />
    );
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Company name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Company name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    
    try {
      const result = await createCompanyForOwner(formData.name, '');
      setResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({ name: '' });
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating company:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to create company',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/admin/dashboard"
            className="flex items-center text-primary-600 hover:text-primary-700 mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Create New Company
        </h1>
        <p className="text-lg text-gray-600">
          Create a new company. You (the admin) will be the owner of this company.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter company name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>


          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>

        {/* Result Display */}
        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <div className={`mt-2 text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>{result.success ? result.message : result.error}</p>
                  {result.success && result.companyId && (
                    <p className="mt-1">Company ID: {result.companyId}</p>
                  )}
                  {result.success && result.transactionHash && (
                    <p className="mt-1">Transaction: {result.transactionHash}</p>
                  )}
                  {result.success && (
                    <p className="mt-2 text-green-600 font-medium">
                      Redirecting to dashboard...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          About Company Creation
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            • The company name must be unique and between 3-100 characters
          </p>
          <p>
            • You (the admin) will be the owner of this company
          </p>
          <p>
            • As the owner, you can manage products and clients for this company
          </p>
          <p>
            • You can later transfer ownership if needed
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
