import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useWallet } from '../hooks/useWallet';
import { useCheckout } from '../hooks/useCheckout';
import { useTokens } from '../hooks/useTokens';
import { productsService } from '../services/productsService';
import InsufficientFundsMessage from './InsufficientFundsMessage';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void; // Made optional since we handle checkout internally
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConnected, address } = useWallet();
  const { balances } = useTokens();
  const { processCheckout, isProcessing, error: checkoutError, clearError } = useCheckout();
  const {
    cart,
    isLoading,
    removeFromCart,
    updateQuantity,
    clearCart,
    isEmpty,
    totalPrice,
    totalQuantity,
  } = useCart();

  const [isValidating] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // Check if user has sufficient token balance
  const hasInsufficientFunds = () => {
    if (!balances || !totalPrice) return false;
    const totalPriceNum = parseFloat(totalPrice);
    const tokenBalanceNum = parseFloat(balances.balanceFormatted);
    return tokenBalanceNum < totalPriceNum;
  };

  // Handle checkout process
  const handleCheckoutProcess = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (isEmpty) {
      alert('Your cart is empty');
      return;
    }

    // Check token balance
    if (hasInsufficientFunds()) {
      setShowInsufficientFunds(true);
      return;
    }

    try {
      clearError();
      setCheckoutSuccess(null);
      
      console.log('Starting checkout process...');
      const result = await processCheckout(cart.items, address); // Company ID will be determined automatically
      
      if (result.success) {
        setCheckoutSuccess(`Purchase completed! Transaction ID: ${result.invoiceId}`);
        clearCart(); // Clear cart after successful purchase
        
        // Don't call onCheckout() to avoid external alerts
        console.log('Purchase completed successfully!');
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          setCheckoutSuccess(null);
          onClose();
        }, 5000);
      } else {
        console.error('Checkout failed:', result.error);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      // Error is handled by the useCheckout hook
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({totalQuantity} items)
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {isEmpty ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600">Add some products to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                      {item.product.image ? (
                        <img
                          src={productsService.getIPFSUrl(item.product.image)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                  <span class="text-xs text-gray-500 font-medium">${item.product.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-500 font-medium">
                            {item.product.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.product.priceFormatted} ITC each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-600 text-sm"
                          disabled={isLoading}
                        >
                          -
                        </button>
                        <span className="text-sm font-medium px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-600 text-sm"
                          disabled={isLoading || item.quantity >= parseInt(item.product.stock)}
                        >
                          +
                        </button>
                        
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-600 hover:text-red-700 text-sm"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {(parseFloat(item.product.priceFormatted) * item.quantity).toFixed(6)} ITC
                      </p>
                      <p className="text-xs text-gray-600">
                        Stock: {item.product.stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isEmpty && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total:</span>
                <span className="text-lg font-bold text-primary-600">
                  {totalPrice} ITC
                </span>
              </div>

              {/* Success Message */}
              {checkoutSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {checkoutSuccess}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {checkoutError}
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Insufficient Funds Message */}
              {showInsufficientFunds && balances && (
                <div className="space-y-3">
                  <InsufficientFundsMessage
                    type="tokens"
                    required={totalPrice || '0'}
                    available={balances.balanceFormatted}
                    showBuyTokensLink={true}
                  />
                  <button
                    onClick={() => setShowInsufficientFunds(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    Hide Message
                  </button>
                </div>
              )}

              {/* User Balance Info */}
              {isConnected && balances && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Your ITC Balance: {parseFloat(balances.balanceFormatted).toFixed(6)} ITC
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isConnected ? (
                  <div className="text-center text-gray-600 text-sm py-2">
                    Please connect your wallet to checkout
                  </div>
                ) : (
                  <button
                    onClick={handleCheckoutProcess}
                    className={`w-full font-medium py-3 px-4 rounded-md transition duration-200 ${
                      isProcessing || isLoading || isValidating
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : hasInsufficientFunds()
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                    disabled={isProcessing || isLoading || isValidating}
                  >
                    {isProcessing
                      ? 'Processing Purchase...'
                      : isLoading || isValidating
                      ? 'Validating...'
                      : hasInsufficientFunds()
                      ? 'Insufficient ITC Tokens'
                      : 'Complete Purchase'
                    }
                  </button>
                )}
                
                <button
                  onClick={handleClearCart}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
                  disabled={isLoading}
                >
                  Clear Cart
                </button>
              </div>

              {/* Cart Summary */}
              <div className="text-xs text-gray-500 text-center">
                {cart.totalItems} unique item(s) • {totalQuantity} total quantity
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
