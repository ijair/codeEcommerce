// Shopping cart service for managing product purchases
import type { ProductData } from './productsService';

export interface CartItem {
  product: ProductData;
  quantity: number;
  addedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalQuantity: number;
  totalPrice: string; // in ETH
  totalPriceWei: string; // in wei
}

export interface CheckoutData {
  items: CartItem[];
  totalAmount: string;
  paymentMethod: 'eth' | 'tokens';
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

export interface CheckoutResult {
  success: boolean;
  message?: string;
  error?: string;
  invoiceId?: string;
  transactionHash?: string;
}

class CartService {
  private readonly CART_STORAGE_KEY = 'itc_shopping_cart';
  private listeners: ((cart: CartSummary) => void)[] = [];

  /**
   * Get current cart items
   */
  getCart(): CartSummary {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = cartData ? JSON.parse(cartData) : [];
      
      return this.calculateCartSummary(items);
    } catch (error) {
      console.error('Error getting cart:', error);
      return this.calculateCartSummary([]);
    }
  }

  /**
   * Add item to cart
   */
  addToCart(product: ProductData, quantity: number = 1): CartSummary {
    try {
      const currentCart = this.getCart();
      const existingItemIndex = currentCart.items.findIndex(
        item => item.product.id === product.id
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        updatedItems = [...currentCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: new Date().toISOString(),
        };
        updatedItems = [...currentCart.items, newItem];
      }

      const newCart = this.calculateCartSummary(updatedItems);
      this.saveCart(updatedItems);
      this.notifyListeners(newCart);
      
      return newCart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return this.getCart();
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): CartSummary {
    try {
      const currentCart = this.getCart();
      const updatedItems = currentCart.items.filter(
        item => item.product.id !== productId
      );

      const newCart = this.calculateCartSummary(updatedItems);
      this.saveCart(updatedItems);
      this.notifyListeners(newCart);
      
      return newCart;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return this.getCart();
    }
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): CartSummary {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }

      const currentCart = this.getCart();
      const updatedItems = currentCart.items.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      );

      const newCart = this.calculateCartSummary(updatedItems);
      this.saveCart(updatedItems);
      this.notifyListeners(newCart);
      
      return newCart;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return this.getCart();
    }
  }

  /**
   * Clear entire cart
   */
  clearCart(): CartSummary {
    try {
      const emptyCart = this.calculateCartSummary([]);
      this.saveCart([]);
      this.notifyListeners(emptyCart);
      
      return emptyCart;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return this.getCart();
    }
  }

  /**
   * Check if product is in cart
   */
  isInCart(productId: string): boolean {
    const cart = this.getCart();
    return cart.items.some(item => item.product.id === productId);
  }

  /**
   * Get quantity of specific product in cart
   */
  getProductQuantity(productId: string): number {
    const cart = this.getCart();
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Validate cart items against current product data
   */
  async validateCart(): Promise<{
    isValid: boolean;
    issues: string[];
    updatedCart?: CartSummary;
  }> {
    try {
      const cart = this.getCart();
      const issues: string[] = [];
      let hasChanges = false;
      const validItems: CartItem[] = [];

      for (const item of cart.items) {
        const product = item.product;
        
        // Check if product is still active
        if (!product.isActive) {
          issues.push(`${product.name} is no longer available`);
          hasChanges = true;
          continue;
        }

        // Check stock availability
        const availableStock = parseInt(product.stock);
        if (availableStock < item.quantity) {
          if (availableStock > 0) {
            // Reduce quantity to available stock
            validItems.push({
              ...item,
              quantity: availableStock,
            });
            issues.push(`${product.name} quantity reduced to ${availableStock} (limited stock)`);
            hasChanges = true;
          } else {
            // Remove item if no stock
            issues.push(`${product.name} is out of stock and was removed`);
            hasChanges = true;
          }
        } else {
          // Item is valid
          validItems.push(item);
        }
      }

      if (hasChanges) {
        const updatedCart = this.calculateCartSummary(validItems);
        this.saveCart(validItems);
        this.notifyListeners(updatedCart);
        
        return {
          isValid: false,
          issues,
          updatedCart,
        };
      }

      return {
        isValid: true,
        issues: [],
      };
    } catch (error) {
      console.error('Error validating cart:', error);
      return {
        isValid: false,
        issues: ['Failed to validate cart'],
      };
    }
  }

  /**
   * Subscribe to cart changes
   */
  subscribe(listener: (cart: CartSummary) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Private helper methods
  private calculateCartSummary(items: CartItem[]): CartSummary {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPriceNumber = items.reduce(
      (sum, item) => sum + (parseFloat(item.product.priceFormatted) * item.quantity), 
      0
    );
    
    // Calculate total price in wei
    const totalPriceWei = items.reduce((sum, item) => {
      const itemPriceWei = BigInt(item.product.price);
      const itemTotalWei = itemPriceWei * BigInt(item.quantity);
      return sum + itemTotalWei;
    }, BigInt(0));

    return {
      items,
      totalItems: items.length,
      totalQuantity,
      totalPrice: totalPriceNumber.toFixed(6),
      totalPriceWei: totalPriceWei.toString(),
    };
  }

  private saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  private notifyListeners(cart: CartSummary): void {
    this.listeners.forEach(listener => {
      try {
        listener(cart);
      } catch (error) {
        console.error('Error notifying cart listener:', error);
      }
    });
  }

  /**
   * Get cart statistics for display
   */
  getCartStats(): {
    isEmpty: boolean;
    hasItems: boolean;
    totalValue: string;
    itemCount: number;
  } {
    const cart = this.getCart();
    
    return {
      isEmpty: cart.items.length === 0,
      hasItems: cart.items.length > 0,
      totalValue: cart.totalPrice,
      itemCount: cart.totalItems,
    };
  }

  /**
   * Prepare checkout data
   */
  prepareCheckout(
    paymentMethod: 'eth' | 'tokens',
    addresses?: CheckoutData['shippingAddress']
  ): CheckoutData {
    const cart = this.getCart();
    
    return {
      items: cart.items,
      totalAmount: cart.totalPriceWei,
      paymentMethod,
      shippingAddress: addresses,
      billingAddress: addresses, // Same as shipping for simplicity
    };
  }
}

export const cartService = new CartService();
