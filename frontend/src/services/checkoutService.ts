import { formatEther, parseEther } from 'ethers';
import type { CheckoutResult } from '../types/contracts';
import type { CartItem } from './cartService';
import { contractService } from './contractService';

/**
 * Service for handling checkout and purchase transactions
 */
class CheckoutService {
  /**
   * Process checkout for items in cart
   */
  async processCheckout(
    cartItems: CartItem[],
    userAddress: string
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
      const invoiceContract = contractService.getContract('invoice');
      
      if (!tokenContract || !productsContract || !companyContract || !invoiceContract) {
        throw new Error('Required contracts not initialized');
      }

      // Calculate total amount and validate stock
      let totalAmount = 0n;
      const purchaseItems = [];

      for (const item of cartItems) {
        const productId = parseInt(item.product.id);
        const quantity = item.quantity;
        const unitPrice = parseEther(item.product.priceFormatted);
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

      console.log('Total amount:', formatEther(totalAmount), 'ITC tokens');

      // Check user token balance
      const userBalance = await tokenContract.balanceOf(userAddress);
      if (userBalance < totalAmount) {
        throw new Error(
          `Insufficient token balance. Required: ${formatEther(totalAmount)} ITC, Available: ${formatEther(userBalance)} ITC`
        );
      }

      // Process each purchase (transfer tokens, update stock, and register client)
      const receipts = [];
      let invoiceId: string | null = null;

      // Group purchases by company for invoice creation
      const purchasesByCompany = new Map<number, any[]>();
      for (const item of purchaseItems) {
        const product = await productsContract.getProduct(item.productId);
        const companyId = product.companyId;
        
        if (!purchasesByCompany.has(companyId)) {
          purchasesByCompany.set(companyId, []);
        }
        purchasesByCompany.get(companyId)!.push({
          ...item,
          companyId
        });
      }

      // Single approval for all purchases (optimize MetaMask confirmations)
      const totalApprovalAmount = purchaseItems.reduce((sum, item) => sum + BigInt(item.totalPrice), 0n);
      console.log(`Approving ${formatEther(totalApprovalAmount)} ITC tokens to invoice contract for all purchases`);
      const invoiceAddress = await invoiceContract.getAddress();
      const approveTx = await tokenContract.approve(invoiceAddress, totalApprovalAmount);
      await approveTx.wait();
      console.log('✅ Token approval completed for all purchases');

      // Process each company's purchases
      for (const [companyId, companyItems] of purchasesByCompany) {
        console.log(`Processing purchases for company ${companyId} with ${companyItems.length} items`);

        // Get company details (for validation)
        await companyContract.getCompany(companyId);
        
        // Create invoice in smart contract for this company (this handles token transfer, stock update, and client registration)
        console.log(`Creating invoice for company ${companyId} - this will handle all operations in one transaction`);
        const invoiceItems = companyItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }));

        const invoiceTx = await invoiceContract.createInvoiceForPurchase(
          companyId,
          Date.now(), // Use timestamp as invoice number
          userAddress,
          invoiceItems,
          true // useTokens = true
        );
        const invoiceReceipt = await invoiceTx.wait();
        receipts.push(invoiceReceipt);
        
        // Get the invoice ID from the transaction receipt
        if (invoiceReceipt.logs && invoiceReceipt.logs.length > 0) {
          // Parse the InvoiceCreated event to get the invoice ID
          const invoiceCreatedEvent = invoiceReceipt.logs.find((log: any) => 
            log.topics[0] === '0x...' // InvoiceCreated event signature
          );
          if (invoiceCreatedEvent) {
            invoiceId = invoiceCreatedEvent.topics[1]; // Invoice ID is in topics[1]
          }
        }
      }

      // Client registration is now handled automatically by the Products contract
      console.log('✅ Client registration completed automatically during purchase');

      // Use invoice ID from smart contract or fallback to timestamp
      const purchaseId = invoiceId || Date.now().toString();
      console.log('Purchase completed with ID:', purchaseId);
      
      // Record purchase in localStorage for user history (keep for backward compatibility)
      this.recordPurchaseInHistory(userAddress, purchaseId, receipts[0]?.hash || 'multiple_transactions', purchaseItems, totalAmount);

      return {
        success: true,
        invoiceId: purchaseId,
        transactionHash: receipts[0]?.hash || 'multiple_transactions',
        totalAmount: formatEther(totalAmount),
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
        totalAmountFormatted: formatEther(totalAmount),
        items: purchaseItems.map(item => ({
          productId: item.productId.toString(),
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: formatEther(item.unitPrice),
          totalPrice: formatEther(item.totalPrice),
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