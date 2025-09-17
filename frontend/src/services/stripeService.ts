// Simulated Stripe service for token purchases
export interface StripePaymentIntent {
  id: string;
  amount: number; // in cents (EUR)
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
}

export interface StripePaymentResult {
  success: boolean;
  paymentIntent?: StripePaymentIntent;
  error?: string;
}

export interface PaymentMethodData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  holderName: string;
}

class StripeService {
  private readonly EUR_TO_ETH_RATE = 3000; // Simulated EUR to ETH conversion rate
  
  /**
   * Convert EUR to ETH (simulated exchange rate)
   */
  convertEurToEth(eurAmount: number): number {
    return eurAmount / this.EUR_TO_ETH_RATE;
  }

  /**
   * Convert ETH to EUR (simulated exchange rate)
   */
  convertEthToEur(ethAmount: number): number {
    return ethAmount * this.EUR_TO_ETH_RATE;
  }

  /**
   * Create payment intent (simulated)
   */
  async createPaymentIntent(amountInEur: number): Promise<StripePaymentIntent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const paymentIntent: StripePaymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amountInEur * 100), // Convert to cents
      currency: 'eur',
      status: 'requires_payment_method',
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
    };

    return paymentIntent;
  }

  /**
   * Process payment (simulated)
   */
  async processPayment(
    paymentIntentId: string, 
    paymentMethod: PaymentMethodData
  ): Promise<StripePaymentResult> {
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment validation
      if (!this.validatePaymentMethod(paymentMethod)) {
        return {
          success: false,
          error: 'Invalid payment method. Please check your card details.',
        };
      }

      // Simulate random payment failures (5% chance)
      if (Math.random() < 0.05) {
        return {
          success: false,
          error: 'Payment failed. Your card was declined. Please try a different payment method.',
        };
      }

      // Simulate successful payment
      const paymentIntent: StripePaymentIntent = {
        id: paymentIntentId,
        amount: 0, // Will be set by the calling function
        currency: 'eur',
        status: 'succeeded',
        client_secret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
      };

      return {
        success: true,
        paymentIntent,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Validate payment method (simulated validation)
   */
  private validatePaymentMethod(paymentMethod: PaymentMethodData): boolean {
    // Basic validation
    if (!paymentMethod.cardNumber || paymentMethod.cardNumber.length < 16) {
      return false;
    }
    
    if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) {
      return false;
    }
    
    if (!paymentMethod.cvc || paymentMethod.cvc.length < 3) {
      return false;
    }
    
    if (!paymentMethod.holderName || paymentMethod.holderName.length < 2) {
      return false;
    }

    // Check expiry date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(`20${paymentMethod.expiryYear}`);
    const expiryMonth = parseInt(paymentMethod.expiryMonth);
    
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return false;
    }

    // Simulate card number validation (Luhn algorithm simulation)
    const cardNumber = paymentMethod.cardNumber.replace(/\s/g, '');
    if (cardNumber === '4000000000000002') {
      return false; // Simulated declined card
    }

    return true;
  }

  /**
   * Get simulated test card numbers
   */
  getTestCards(): { number: string; description: string }[] {
    return [
      { number: '4242 4242 4242 4242', description: 'Visa - Success' },
      { number: '5555 5555 5555 4444', description: 'Mastercard - Success' },
      { number: '4000 0000 0000 0002', description: 'Visa - Declined' },
      { number: '4000 0000 0000 9995', description: 'Visa - Insufficient Funds' },
    ];
  }

  /**
   * Calculate Stripe fees (simulated)
   */
  calculateStripeFees(amountInEur: number): {
    fixedFee: number;
    percentageFee: number;
    totalFee: number;
    netAmount: number;
  } {
    const fixedFee = 0.30; // €0.30 fixed fee
    const percentageRate = 0.029; // 2.9%
    const percentageFee = amountInEur * percentageRate;
    const totalFee = fixedFee + percentageFee;
    const netAmount = amountInEur - totalFee;

    return {
      fixedFee,
      percentageFee,
      totalFee,
      netAmount,
    };
  }

  /**
   * Format currency amounts
   */
  formatEur(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatEth(amount: string | number): string {
    const ethAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${ethAmount.toFixed(6)} ETH`;
  }
}

// Export singleton instance
export const stripeService = new StripeService();
