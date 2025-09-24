import React from 'react';
import type { ProductData } from '../services/productsService';
import { productsService } from '../services/productsService';

interface ProductCardProps {
  product: ProductData;
  onAddToCart?: (product: ProductData) => void;
  onViewDetails?: (product: ProductData) => void;
  showActions?: boolean;
  isConnected?: boolean;
  onConnectWallet?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  showActions = true,
  isConnected = true,
  onConnectWallet,
}) => {
  const imageUrl = productsService.getIPFSUrl(product.image);
  const hasStock = parseInt(product.stock) > 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200">
        {product.image ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to showing the placeholder div instead
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                    <div class="text-center">
                      <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-sm text-gray-500">${product.name}</p>
                    </div>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex space-x-2">
          {!product.isActive && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              Inactive
            </span>
          )}
          {!hasStock && product.isActive && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
          {hasStock && product.isActive && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">
            Company ID: {product.companyId}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-bold text-primary-600">
            {product.priceFormatted} ITC
          </div>
          <div className="text-sm text-gray-600">
            Stock: {product.stock}
          </div>
        </div>

        {/* Product Actions */}
        {showActions && (
          <div className="flex space-x-2">
            {!isConnected ? (
              <button
                onClick={onConnectWallet}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-md transition duration-200"
              >
                Connect to Shop
              </button>
            ) : product.isActive && hasStock ? (
              <button
                onClick={() => onAddToCart?.(product)}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-md transition duration-200"
              >
                Add to Cart
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-300 text-gray-500 text-sm font-medium py-2 px-3 rounded-md cursor-not-allowed"
              >
                {!product.isActive ? 'Unavailable' : 'Out of Stock'}
              </button>
            )}
            
            <button
              onClick={() => onViewDetails?.(product)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md transition duration-200"
            >
              Details
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>ID: {product.id}</span>
            <span>
              Updated: {new Date(parseInt(product.updatedAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
