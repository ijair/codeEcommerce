import { useState } from 'react';
import type { CheckoutResult } from '../types/contracts';
import type { CartItem } from '../services/cartService';
import { checkoutService } from '../services/checkoutService';

export const useCheckout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process checkout for cart items
   */
  const processCheckout = async (
    cartItems: CartItem[],
    userAddress: string
  ): Promise<CheckoutResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate cart items first
      const validation = await checkoutService.validateCartItems(cartItems);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Process checkout
      const result = await checkoutService.processCheckout(cartItems, userAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Checkout failed');
      }

      return result;
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Note: getUserInvoices removed as it's not implemented in the new checkout service

  /**
   * Validate cart items
   */
  const validateCart = async (cartItems: CartItem[]): Promise<{isValid: boolean, errors: string[]}> => {
    try {
      setError(null);
      return await checkoutService.validateCartItems(cartItems);
    } catch (error: any) {
      console.error('Validation error:', error);
      const errorMessage = error.message || 'Validation failed';
      setError(errorMessage);
      return { isValid: false, errors: [errorMessage] };
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    isProcessing,
    error,
    processCheckout,
    validateCart,
    clearError
  };
};
