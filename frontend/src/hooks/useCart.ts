import { useState, useEffect, useCallback } from 'react';
import { cartService, type CartSummary } from '../services/cartService';
import type { ProductData } from '../services/productsService';

export const useCart = () => {
  const [cart, setCart] = useState<CartSummary>(cartService.getCart());
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to cart changes
  useEffect(() => {
    const unsubscribe = cartService.subscribe(setCart);
    return unsubscribe;
  }, []);

  const addToCart = useCallback((product: ProductData, quantity: number = 1) => {
    setIsLoading(true);
    try {
      const updatedCart = cartService.addToCart(product, quantity);
      setCart(updatedCart);
      return {
        success: true,
        message: `${product.name} added to cart!`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add item to cart',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setIsLoading(true);
    try {
      const updatedCart = cartService.removeFromCart(productId);
      setCart(updatedCart);
      return {
        success: true,
        message: 'Item removed from cart',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove item from cart',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = cartService.updateQuantity(productId, quantity);
      setCart(updatedCart);
      return {
        success: true,
        message: 'Quantity updated',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update quantity',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    setIsLoading(true);
    try {
      const updatedCart = cartService.clearCart();
      setCart(updatedCart);
      return {
        success: true,
        message: 'Cart cleared',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to clear cart',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const validation = await cartService.validateCart();
      if (validation.updatedCart) {
        setCart(validation.updatedCart);
      }
      return validation;
    } catch (error: any) {
      return {
        isValid: false,
        issues: [error.message || 'Failed to validate cart'],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isInCart = useCallback((productId: string) => {
    return cartService.isInCart(productId);
  }, []);

  const getProductQuantity = useCallback((productId: string) => {
    return cartService.getProductQuantity(productId);
  }, []);

  const prepareCheckout = useCallback((paymentMethod: 'eth' | 'tokens') => {
    return cartService.prepareCheckout(paymentMethod);
  }, []);

  return {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCart,
    isInCart,
    getProductQuantity,
    prepareCheckout,
    // Computed properties
    isEmpty: cart.items.length === 0,
    hasItems: cart.items.length > 0,
    totalItems: cart.totalItems,
    totalQuantity: cart.totalQuantity,
    totalPrice: cart.totalPrice,
    totalPriceWei: cart.totalPriceWei,
  };
};
