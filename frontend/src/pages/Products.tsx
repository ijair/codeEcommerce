import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import ProductCard from '../components/ProductCard';
import ProductFiltersComponent from '../components/ProductFilters';
import ShoppingCart from '../components/ShoppingCart';
import { productsService } from '../services/productsService';
import type { ProductData, ProductFilters } from '../services/productsService';

const Products: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const {
    products,
    isLoading,
    error,
    totalCount,
    applyFilters,
    clearFilters,
    refreshProducts,
  } = useProducts();

  const {
    addToCart,
    hasItems,
    totalItems,
  } = useCart();

  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const handleFiltersChange = (filters: ProductFilters) => {
    applyFilters(filters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleAddToCart = (product: ProductData) => {
    const result = addToCart(product, 1);
    if (result.success) {
      // Optionally show a toast notification instead of alert
      console.log(result.message);
    } else {
      alert(result.error || 'Failed to add item to cart');
    }
  };

  const handleViewDetails = (product: ProductData) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCheckout = () => {
    setShowCart(false);
    // Navigate to checkout page or show checkout modal
    alert('Checkout functionality coming soon!');
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet to Browse Products</h2>
        <p className="text-lg text-gray-600 mb-6">Please connect your MetaMask wallet to access the product marketplace.</p>
        <button
          onClick={connectWallet}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Product Marketplace</h1>
            <p className="text-lg text-gray-600">
              Discover and purchase products using ITC tokens from decentralized companies
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className={`relative bg-primary-100 hover:bg-primary-200 text-primary-800 px-4 py-2 rounded-lg transition duration-200 ${
                hasItems ? 'ring-2 ring-primary-300' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="font-medium">
                  Cart {hasItems && `(${totalItems})`}
                </span>
              </div>
              {hasItems && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </div>
              )}
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={refreshProducts}
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
          <span>Total Products: {totalCount}</span>
          <span>Showing: {products.length}</span>
          {hasItems && <span>Cart: {totalItems} items</span>}
        </div>
      </div>

      {/* Token Info Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Payment Information</p>
            <p className="text-sm">All products are priced in ITC tokens. Make sure you have enough tokens in your wallet to purchase. 
              <a href="/tokens" className="font-bold underline ml-1">Buy tokens here</a>.
            </p>
          </div>
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

      {/* Filters */}
      <ProductFiltersComponent
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m14 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m14 0H6m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {totalCount === 0 
                  ? "No products have been created yet." 
                  : "Try adjusting your filters to see more products."
                }
              </p>
              {totalCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Shopping Cart Sidebar */}
      <ShoppingCart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckout}
      />

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div>
                  <img
                    src={selectedProduct.image ? productsService.getIPFSUrl(selectedProduct.image) : `https://via.placeholder.com/400x300/e5e7eb/6b7280?text=${encodeURIComponent(selectedProduct.name)}`}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                {/* Product Details */}
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Price</label>
                      <p className="text-2xl font-bold text-primary-600">{selectedProduct.priceFormatted} ITC</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Stock Available</label>
                      <p className="text-lg">{selectedProduct.stock} units</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company ID</label>
                      <p>{selectedProduct.companyId}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Product ID</label>
                      <p className="font-mono text-sm">{selectedProduct.id}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedProduct.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedProduct.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm">{new Date(parseInt(selectedProduct.createdAt) * 1000).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-sm">{new Date(parseInt(selectedProduct.updatedAt) * 1000).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    {selectedProduct.isActive && parseInt(selectedProduct.stock) > 0 ? (
                      <button
                        onClick={() => {
                          handleAddToCart(selectedProduct);
                          setShowProductModal(false);
                        }}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-medium py-3 px-4 rounded-md cursor-not-allowed"
                      >
                        {!selectedProduct.isActive ? 'Product Unavailable' : 'Out of Stock'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
