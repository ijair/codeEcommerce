import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useAdmin } from '../../hooks/useAdmin';
import { useProducts } from '../../hooks/useProducts';
import { useCompanies } from '../../hooks/useCompanies';
import AccessDenied from '../../components/AccessDenied';
import type { ProductResult } from '../../services/productsService';

const CreateProduct: React.FC = () => {
  const { isConnected } = useWallet();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { createProduct, isLoading } = useProducts();
  const { companies } = useCompanies();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    price: '',
    image: 'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme',
    stock: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<ProductResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set first company as default when companies are loaded
  useEffect(() => {
    if (companies.length > 0 && !formData.companyId) {
      setFormData(prev => ({ ...prev, companyId: companies[0].id }));
    }
  }, [companies, formData.companyId]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-lg text-gray-600 mb-8">
            Please connect your MetaMask wallet to create products.
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

    if (!formData.companyId) {
      newErrors.companyId = 'Please select a company';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Product name must be less than 100 characters';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Price must be a positive number';
      }
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid IPFS URL';
    } else if (!formData.image.includes('ipfs.io/ipfs/')) {
      newErrors.image = 'Please use a valid IPFS URL (e.g., https://ipfs.io/ipfs/...)';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'Stock must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    
    try {
      const result = await createProduct(
        formData.companyId,
        formData.name,
        parseFloat(formData.price),
        formData.image,
        parseInt(formData.stock)
      );
      setResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          companyId: companies.length > 0 ? companies[0].id : '',
          name: '',
          price: '',
          image: '',
          stock: '',
        });
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to create product',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          Create New Product
        </h1>
        <p className="text-lg text-gray-600">
          Create a new product for a company. You (the admin) can create products for any company.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.companyId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
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
              placeholder="Enter product name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (ITC Tokens) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="10.50"
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Price in ITC tokens (e.g., 10.50 for 10.50 ITC)
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL *
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.image ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme"
              disabled={isSubmitting}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              IPFS URL for product image (using demo IPFS link for testing)
            </p>
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.stock ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="100"
              disabled={isSubmitting}
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
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
              {isSubmitting ? 'Creating...' : 'Create Product'}
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
                  {result.success && result.productId && (
                    <p className="mt-1">Product ID: {result.productId}</p>
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
          About Product Creation
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            • Select the company that will own this product
          </p>
          <p>
            • Product name must be between 3-100 characters
          </p>
          <p>
            • Price is in ITC tokens with 2 decimal places (e.g., 10.50 ITC)
          </p>
          <p>
            • Image URL must be a valid IPFS address (demo link provided)
          </p>
          <p>
            • Stock quantity must be a non-negative number
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
