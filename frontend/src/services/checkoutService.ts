import { ethers } from 'ethers';
import type { CheckoutResult } from '../types/contracts';
import type { CartItem } from './cartService';
import { contractService } from './contractService';
import { clientService } from './clientService';

/**
 * Service for handling checkout and purchase transactions
 */
class CheckoutService {
  /**
   * Process checkout for items in cart
   */
  async processCheckout(
    cartItems: CartItem[],
    userAddress: string,
    options: {
      registerAsClient?: boolean;
      skipClientRegistration?: boolean;
    } = {}
  ): Promise<CheckoutResult> {
    try {
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      if (!userAddress) {
        throw new Error('User address is required');
      }

      console.log('Processing checkout for', cartItems.length, 'items');

      // Get contracts
      const tokenContract = contractService.getContract('token');
      const productsContract = contractService.getContract('products');
      const companyContract = contractService.getContract('company');
      
      if (!tokenContract || !productsContract || !companyContract) {
        throw new Error('Required contracts not initialized');
      }

      // Calculate total amount and validate stock
      let totalAmount = 0n;
      const purchaseItems = [];

      for (const item of cartItems) {
        const productId = parseInt(item.product.id);
        const quantity = item.quantity;
        const unitPrice = ethers.parseEther(item.product.priceFormatted);
        const totalPrice = unitPrice * BigInt(quantity);

        // Verify stock availability
        const hasStock = await productsContract.hasStockAvailable(productId, quantity);
        if (!hasStock) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }

        totalAmount += totalPrice;
        purchaseItems.push({
          productId,
          quantity,
          unitPrice,
          totalPrice,
          product: item.product
        });
      }

      console.log('Total amount:', ethers.formatEther(totalAmount), 'ITC tokens');

      // Check user token balance
      const userBalance = await tokenContract.balanceOf(userAddress);
      if (userBalance < totalAmount) {
        throw new Error(
          `Insufficient token balance. Required: ${ethers.formatEther(totalAmount)} ITC, Available: ${ethers.formatEther(userBalance)} ITC`
        );
      }

      // Process each purchase (transfer tokens and update stock)
      const receipts = [];
      const purchasesByCompany = new Map<string, {
        companyId: bigint;
        totalAmount: bigint;
        products: Array<{productId: number; quantity: number; price: bigint}>;
      }>();

      for (const item of purchaseItems) {
        console.log(`Processing purchase for product ${item.productId}, quantity ${item.quantity}`);

        // Get product and company details
        const product = await productsContract.getProduct(item.productId);
        const company = await companyContract.getCompany(product.companyId);

        // Transfer tokens to company owner
        console.log(`Transferring ${ethers.formatEther(item.totalPrice)} ITC tokens to company owner ${company.owner}`);
        const transferTx = await tokenContract.transfer(company.owner, item.totalPrice);
        const transferReceipt = await transferTx.wait();
        receipts.push(transferReceipt);

        // Update product stock using the new purchaseProduct function
        console.log(`Updating stock for product ${item.productId}, reducing by ${item.quantity}`);
        const stockTx = await productsContract.purchaseProduct(item.productId, item.quantity);
        const stockReceipt = await stockTx.wait();
        receipts.push(stockReceipt);

        // Store company info for later client registration (optimize to single call)
        if (!purchasesByCompany.has(product.companyId.toString())) {
          purchasesByCompany.set(product.companyId.toString(), {
            companyId: product.companyId,
            totalAmount: 0n,
            products: []
          });
        }
        
        const companyPurchase = purchasesByCompany.get(product.companyId.toString())!;
        companyPurchase.totalAmount += item.totalPrice;
        companyPurchase.products.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.totalPrice
        });
      }

      // Register client purchases (optimized batch processing)
      if (!options.skipClientRegistration && options.registerAsClient !== false) {
        const purchasesToRegister = Array.from(purchasesByCompany.values()).map(p => ({
          companyId: p.companyId,
          totalAmount: p.totalAmount
        }));

        const registrationResult = await clientService.batchRegisterPurchases(userAddress, purchasesToRegister);
        
        if (registrationResult.success) {
          console.log(`✅ Client registration completed. Total gas used: ${registrationResult.gasUsed}`);
        } else {
          console.warn(`⚠️ Client registration partially failed. Errors: ${registrationResult.errors.length}`);
          // Continue with purchase even if client registration fails
        }
      } else {
        console.log('💰 Skipping client registration to save gas costs (~180k gas per company)');
      }

      // Generate purchase ID (no formal invoice creation as client is not company owner)
      const purchaseId = Date.now().toString();
      console.log('Purchase completed with ID:', purchaseId);
      
      // Record purchase in localStorage for user history
      this.recordPurchaseInHistory(userAddress, purchaseId, receipts[0]?.hash || 'multiple_transactions', purchaseItems, totalAmount);

      return {
        success: true,
        invoiceId: purchaseId,
        transactionHash: receipts[0]?.hash || 'multiple_transactions',
        totalAmount: ethers.formatEther(totalAmount),
        message: 'Purchase completed successfully!'
      };

    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Insufficient token balance')) {
        throw error; // Re-throw with original message
      } else if (error.message?.includes('Insufficient stock')) {
        throw new Error('Some items in your cart are out of stock. Please refresh and try again.');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction was rejected by user.');
      } else {
        throw new Error(`Checkout failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Record purchase in localStorage for user history
   */
  private recordPurchaseInHistory(
    userAddress: string,
    purchaseId: string,
    transactionHash: string,
    purchaseItems: any[],
    totalAmount: bigint
  ): void {
    try {
      const storageKey = `purchase_history_${userAddress.toLowerCase()}`;
      const existingHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const newPurchase = {
        id: purchaseId,
        date: Date.now(),
        transactionHash: transactionHash,
        totalAmount: totalAmount.toString(),
        totalAmountFormatted: ethers.formatEther(totalAmount),
        items: purchaseItems.map(item => ({
          productId: item.productId.toString(),
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: ethers.formatEther(item.unitPrice),
          totalPrice: ethers.formatEther(item.totalPrice),
          companyId: item.product.companyId
        })),
        status: 'completed'
      };
      
      existingHistory.unshift(newPurchase); // Add to beginning
      
      // Keep only last 50 purchases
      if (existingHistory.length > 50) {
        existingHistory.splice(50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingHistory));
      console.log('Purchase recorded in history');
      
    } catch (error) {
      console.error('Error recording purchase history:', error);
    }
  }

  /**
   * Validate cart items before checkout
   */
  async validateCartItems(cartItems: CartItem[]): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];

    try {
      const productsContract = contractService.getContract('products');
      if (!productsContract) {
        errors.push('Products contract not available');
        return { isValid: false, errors };
      }

      for (const item of cartItems) {
        try {
          // Check if product still exists and is active
          const product = await productsContract.getProduct(item.product.id);
          if (!product.isActive) {
            errors.push(`Product "${item.product.name}" is no longer available`);
            continue;
          }

          // Check stock availability
          const hasStock = await productsContract.hasStockAvailable(item.product.id, item.quantity);
          if (!hasStock) {
            const currentStock = await productsContract.getProductStock(item.product.id);
            errors.push(`Insufficient stock for "${item.product.name}". Available: ${currentStock}, Requested: ${item.quantity}`);
          }
        } catch (error) {
          errors.push(`Error validating product "${item.product.name}": ${error}`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Validation error: ${error}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Get user's purchase history from localStorage
   */
  getUserPurchaseHistory(userAddress: string): any[] {
    try {
      const storageKey = `purchase_history_${userAddress.toLowerCase()}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  }

  /**
   * Get purchase statistics for a user
   */
  getPurchaseStats(userAddress: string): {
    totalPurchases: number;
    totalSpent: string;
    averageOrderValue: string;
    lastPurchaseDate: string | null;
  } {
    try {
      const history = this.getUserPurchaseHistory(userAddress);
      
      if (history.length === 0) {
        return {
          totalPurchases: 0,
          totalSpent: '0',
          averageOrderValue: '0',
          lastPurchaseDate: null
        };
      }

      const totalSpent = history.reduce((sum: number, purchase: any) => {
        return sum + parseFloat(purchase.totalAmountFormatted);
      }, 0);

      const averageOrderValue = totalSpent / history.length;
      const lastPurchase = history[0]; // First item is most recent
      
      return {
        totalPurchases: history.length,
        totalSpent: totalSpent.toFixed(6),
        averageOrderValue: averageOrderValue.toFixed(6),
        lastPurchaseDate: new Date(lastPurchase.date).toLocaleDateString()
      };
      
    } catch (error) {
      console.error('Error calculating purchase stats:', error);
      return {
        totalPurchases: 0,
        totalSpent: '0',
        averageOrderValue: '0',
        lastPurchaseDate: null
      };
    }
  }

  /**
   * Clear purchase history for a user
   */
  clearPurchaseHistory(userAddress: string): void {
    try {
      const storageKey = `purchase_history_${userAddress.toLowerCase()}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing purchase history:', error);
    }
  }
}

export const checkoutService = new CheckoutService();