import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useCompanies } from '../hooks/useCompanies';
import { productsService } from '../services/productsService';
import { ipfsService } from '../services/ipfsService';
import type { ProductResult, ProductCreateData } from '../services/productsService';

interface CreateProductFormProps {
  onSuccess?: (result: ProductResult) => void;
  onCancel?: () => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { address } = useWallet();
  const { companies, loadAllCompanies, createCompany, isLoading: companiesLoading } = useCompanies();
  
  const [formData, setFormData] = useState<ProductCreateData>({
    companyId: '',
    name: '',
    price: '',
    image: '',
    stock: '',
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<ProductResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Load companies on mount - load by owner for regular users, all for admin
  useEffect(() => {
    if (address) {
      // For now, load all companies and let the user see which ones they can use
      loadAllCompanies();
    }
  }, [address, loadAllCompanies]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        ipfsService.revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.companyId) {
      newErrors.companyId = 'Please select a company';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Product name must be less than 200 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    } else if (parseFloat(formData.price) > 100000) {
      newErrors.price = 'Price must be less than 100,000 ITC tokens';
    }

    if (!formData.stock) {
      newErrors.stock = 'Stock quantity is required';
    } else if (parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock cannot be negative';
    } else if (parseInt(formData.stock) > 1000000) {
      newErrors.stock = 'Stock must be less than 1,000,000 units';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup previous preview
    if (previewUrl) {
      ipfsService.revokePreviewUrl(previewUrl);
    }

    // Validate file
    const validation = ipfsService['validateFile'](file);
    if (!validation.isValid) {
      setErrors({ ...errors, image: validation.error || 'Invalid file' });
      return;
    }

    // Set new file and create preview
    setSelectedFile(file);
    const preview = ipfsService.createPreviewUrl(file);
    setPreviewUrl(preview);
    
    // Clear image error
    const newErrors = { ...errors };
    delete newErrors.image;
    setErrors(newErrors);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploadingImage(true);
    try {
      const uploadResult = await ipfsService.uploadFile(selectedFile);
      
      if (uploadResult.success && uploadResult.hash) {
        setFormData({ ...formData, image: uploadResult.hash });
        setResult({
          success: true,
          message: `Image uploaded successfully! Hash: ${uploadResult.hash}`,
        });
      } else {
        setErrors({ ...errors, image: uploadResult.error || 'Failed to upload image' });
      }
    } catch (error: any) {
      setErrors({ ...errors, image: error.message || 'Failed to upload image' });
    } finally {
      setIsUploadingImage(false);
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
      const result = await productsService.createProduct(formData);
      setResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          companyId: '',
          name: '',
          price: '',
          image: '',
          stock: '',
        });
        setSelectedFile(null);
        if (previewUrl) {
          ipfsService.revokePreviewUrl(previewUrl);
          setPreviewUrl('');
        }
        setErrors({});
        
        // Call success callback
        onSuccess?.(result);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Failed to create product',
        error: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      companyId: '',
      name: '',
      price: '',
      image: '',
      stock: '',
    });
    setSelectedFile(null);
    if (previewUrl) {
      ipfsService.revokePreviewUrl(previewUrl);
      setPreviewUrl('');
    }
    setErrors({});
    setResult(null);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setErrors({ ...errors, company: 'Company name is required' });
      return;
    }

    try {
      const result = await createCompany(newCompanyName);
      if (result.success) {
        setNewCompanyName('');
        setShowCreateCompany(false);
        // Reload companies and select the new one
        await loadAllCompanies();
        if ('companyId' in result && result.companyId) {
          setFormData({ ...formData, companyId: result.companyId });
        }
        setResult({
          success: true,
          message: `Company "${newCompanyName}" created successfully! You can now create products for it.`,
        });
      } else {
        setErrors({ ...errors, company: result.error || 'Failed to create company' });
      }
    } catch (error: any) {
      setErrors({ ...errors, company: error.message || 'Failed to create company' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Product</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
              Company *
            </label>
            <button
              type="button"
              onClick={() => setShowCreateCompany(!showCreateCompany)}
              className="text-sm text-primary-600 hover:text-primary-700 underline"
              disabled={isSubmitting}
            >
              {showCreateCompany ? 'Cancel' : 'Create New Company'}
            </button>
          </div>
          
          {showCreateCompany ? (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <label htmlFor="newCompanyName" className="block text-sm font-medium text-gray-700 mb-1">
                  New Company Name
                </label>
                <input
                  type="text"
                  id="newCompanyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter company name"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                onClick={handleCreateCompany}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                disabled={isSubmitting || !newCompanyName.trim()}
              >
                Create Company
              </button>
              {errors.company && (
                <p className="text-sm text-red-600">{errors.company}</p>
              )}
            </div>
          ) : (
            <>
              <select
                id="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                  errors.companyId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting || companiesLoading}
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} (ID: {company.id}) - Owner: {company.owner.slice(0, 6)}...{company.owner.slice(-4)}
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
              
              {companies.length === 0 && !companiesLoading && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No companies available. You need to create a company first to add products.
                  </p>
                </div>
              )}
              
              {companies.length > 0 && address && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can only create products for companies you own. 
                    Your address: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="productName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter product name (e.g., Gaming Laptop Pro)"
            disabled={isSubmitting}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Price and Stock Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (ITC Tokens) *
            </label>
            <input
              type="number"
              id="price"
              step="0.000001"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                errors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="10.0"
              disabled={isSubmitting}
              required
            />
            <p className="mt-1 text-xs text-gray-600">
              Price in ITC tokens (customers will pay with their token balance)
            </p>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Stock *
            </label>
            <input
              type="number"
              id="stock"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                errors.stock ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="100"
              disabled={isSubmitting}
              required
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image (Optional)
          </label>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                disabled={isSubmitting || isUploadingImage}
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Preview and Upload */}
            {selectedFile && (
              <div className="flex space-x-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                
                {/* File Info and Upload */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {ipfsService.formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                  
                  {!formData.image ? (
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      className={`mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded transition duration-200 ${
                        isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isUploadingImage || isSubmitting}
                    >
                      {isUploadingImage ? 'Uploading to IPFS...' : 'Upload to IPFS'}
                    </button>
                  ) : (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Uploaded to IPFS: {formData.image}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual IPFS Hash Input */}
            <div>
              <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-700 mb-1">
                Or enter IPFS hash manually:
              </label>
              <input
                type="text"
                id="ipfsHash"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="QmYourIPFSHashHere..."
                disabled={isSubmitting}
              />
              
              {/* Test IPFS Hashes */}
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quick Test Hashes:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: 'Test Image 1', hash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' },
                    { name: 'Test Image 2', hash: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB' },
                    { name: 'Demo Product', hash: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o' },
                  ].map((testHash) => (
                    <button
                      key={testHash.hash}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: testHash.hash })}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition duration-200"
                      disabled={isSubmitting}
                    >
                      {testHash.name}
                    </button>
                  ))}
                </div>
                
                {/* Skip Image Button */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                    disabled={isSubmitting}
                  >
                    Skip image (create product without image)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className={`flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ${
              isSubmitting || isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting || isUploadingImage}
          >
            {isSubmitting ? 'Creating Product...' : 'Create Product'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={isSubmitting}
          >
            Reset
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
              disabled={isSubmitting}
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
                {result.success && result.productId && (
                  <p className="text-sm mt-1">Product ID: {result.productId}</p>
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
        <h4 className="text-sm font-medium text-blue-900 mb-2">Product Creation Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Product images are stored on IPFS for decentralized access</li>
          <li>• Prices are set in ITC tokens and customers pay with their token balance</li>
          <li>• Stock quantities can be updated after product creation</li>
          <li>• Only company owners can create products for their companies</li>
          <li>• Customers need ITC tokens to purchase products (buy tokens first)</li>
          <li>• Supported image formats: JPEG, PNG, GIF, WebP (max 10MB)</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateProductForm;
