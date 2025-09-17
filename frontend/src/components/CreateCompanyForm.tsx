import React, { useState } from 'react';
import { useCompanies } from '../hooks/useCompanies';
import type { CompanyResult } from '../services/companiesService';

interface CreateCompanyFormProps {
  onSuccess?: (result: CompanyResult) => void;
  onCancel?: () => void;
}

const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createCompany, isLoading } = useCompanies();
  
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<CompanyResult | null>(null);

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

    setResult(null);
    
    try {
      const result = await createCompany(formData.name);
      setResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({ name: '' });
        setErrors({});
        
        // Call success callback
        onSuccess?.(result);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Failed to create company',
        error: error.message,
      });
    }
  };

  const handleReset = () => {
    setFormData({ name: '' });
    setErrors({});
    setResult(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Company</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            id="companyName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter company name (e.g., Tech Solutions Inc.)"
            disabled={isLoading}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className={`flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Company...' : 'Create Company'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={isLoading}
          >
            Reset
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mt-4 p-3 rounded-md ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${result.success ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {result.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <div>
                <p className="font-medium">{result.message}</p>
                {result.success && result.companyId && (
                  <p className="text-sm mt-1">Company ID: {result.companyId}</p>
                )}
                {result.success && result.transactionHash && (
                  <p className="text-sm mt-1">
                    Transaction: {result.transactionHash.slice(0, 10)}...
                  </p>
                )}
                {result.error && (
                  <p className="text-sm mt-1">Error: {result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Information */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Company Creation Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Company names must be unique across the platform</li>
          <li>• You will be the owner of the company once created</li>
          <li>• Company owners can create and manage products</li>
          <li>• Company status can be managed through the admin dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateCompanyForm;
