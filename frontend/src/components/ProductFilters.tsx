import React, { useState } from 'react';
import type { ProductFilters } from '../services/productsService';

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const ProductFiltersComponent: React.FC<ProductFiltersProps> = ({
  onFiltersChange,
  onClearFilters,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: ProductFilters = {
      searchQuery: searchQuery.trim() || undefined,
      companyId: companyId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      activeOnly,
    };

    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCompanyId('');
    setMinPrice('');
    setMaxPrice('');
    setActiveOnly(true);
    onClearFilters();
  };

  const handleQuickPriceFilter = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
    
    const filters: ProductFilters = {
      searchQuery: searchQuery.trim() || undefined,
      companyId: companyId || undefined,
      minPrice: min,
      maxPrice: max,
      activeOnly,
    };

    onFiltersChange(filters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Products</h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Query */}
        <div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Filter */}
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
              Company ID
            </label>
            <input
              type="text"
              id="companyId"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="e.g., 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
          </div>

          {/* Min Price */}
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Min Price (ITC)
            </label>
            <input
              type="text"
              id="minPrice"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
          </div>

          {/* Max Price */}
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Max Price (ITC)
            </label>
            <input
              type="text"
              id="maxPrice"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="1000.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Quick Price Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Price Ranges
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickPriceFilter('0', '10')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-full transition duration-200"
              disabled={isLoading}
            >
              Under 10 ITC
            </button>
            <button
              type="button"
              onClick={() => handleQuickPriceFilter('10', '100')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-full transition duration-200"
              disabled={isLoading}
            >
              10 - 100 ITC
            </button>
            <button
              type="button"
              onClick={() => handleQuickPriceFilter('100', '1000')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-full transition duration-200"
              disabled={isLoading}
            >
              100 - 1000 ITC
            </button>
            <button
              type="button"
              onClick={() => handleQuickPriceFilter('1000', '100000')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-full transition duration-200"
              disabled={isLoading}
            >
              1000+ ITC
            </button>
          </div>
        </div>

        {/* Active Only Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="activeOnly"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="mr-2 text-primary-600 focus:ring-primary-500"
            disabled={isLoading}
          />
          <label htmlFor="activeOnly" className="text-sm font-medium text-gray-700">
            Show only active products
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className={`flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Filtering...' : 'Apply Filters'}
          </button>
          
          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={isLoading}
          >
            Clear All
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFiltersComponent;
