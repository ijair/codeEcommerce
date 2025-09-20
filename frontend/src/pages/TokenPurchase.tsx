import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useTokens } from '../hooks/useTokens';
import { stripeService, type PaymentMethodData } from '../services/stripeService';
import InsufficientFundsMessage from '../components/InsufficientFundsMessage';

const TokenPurchase: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { 
    balances, 
    tokenInfo, 
    priceInfo, 
    isLoading, 
    error, 
    buyTokens, 
    calculateBuyTokensCost,
    fullFillTokens,
    checkIsOwner
  } = useTokens();

  const [tokenAmount, setTokenAmount] = useState('');
  const [costInfo, setCostInfo] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCalculatedAmount, setLastCalculatedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    holderName: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [hasCalculatedCost, setHasCalculatedCost] = useState(false);
  
  // Owner-specific states
  const [isOwner, setIsOwner] = useState(false);
  const [ownerEthAmount, setOwnerEthAmount] = useState('');
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  // Reset state when wallet address changes
  useEffect(() => {
    setTokenAmount('');
    setCostInfo(null);
    setInsufficientFunds(false);
    setHasCalculatedCost(false);
    setShowPaymentForm(false);
    setSuccessMessage('');
    setLastCalculatedAmount('');
    setOwnerEthAmount('');
    setShowOwnerPanel(false);
  }, [address]);

  // Check if user is owner
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (isConnected && address) {
        const ownerStatus = await checkIsOwner();
        setIsOwner(ownerStatus);
      } else {
        setIsOwner(false);
      }
    };
    
    checkOwnerStatus();
  }, [isConnected, address, checkIsOwner]);

  // Calculate cost when token amount changes (optimized to prevent constant recalculation)
  useEffect(() => {
    const calculateCost = async () => {
      // Skip calculation if amount hasn't changed or is invalid
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
        if (costInfo !== null) {
          setCostInfo(null);
          setInsufficientFunds(false);
          setHasCalculatedCost(false);
          setLastCalculatedAmount('');
        }
        return;
      }

      // Skip calculation if we already calculated for this amount
      if (tokenAmount === lastCalculatedAmount && costInfo) {
        return;
      }

      setIsCalculating(true);
      try {
        const cost = await calculateBuyTokensCost(tokenAmount);
        setCostInfo(cost);
        setHasCalculatedCost(true);
        setLastCalculatedAmount(tokenAmount);
        
        // Check if user has enough ETH only if we have both balances and cost info
        if (balances && cost && balances.ethBalance && cost.totalCost) {
          const userEthBalance = BigInt(balances.ethBalance);
          const requiredEth = BigInt(cost.totalCost);
          setInsufficientFunds(userEthBalance < requiredEth);
        } else {
          setInsufficientFunds(false);
        }
      } catch (err) {
        console.error('Error calculating cost:', err);
        setCostInfo(null);
        setInsufficientFunds(false);
        setHasCalculatedCost(false);
        setLastCalculatedAmount('');
      } finally {
        setIsCalculating(false);
      }
    };

    // Longer debounce to reduce calculation frequency
    const debounceTimer = setTimeout(calculateCost, 800);
    return () => clearTimeout(debounceTimer);
  }, [tokenAmount, calculateBuyTokensCost]); // Removed balances from dependencies to prevent constant recalculation

  // Separate effect to check insufficient funds when balance changes (without recalculating cost)
  useEffect(() => {
    if (balances && costInfo && costInfo.totalCost) {
      const userEthBalance = BigInt(balances.ethBalance);
      const requiredEth = BigInt(costInfo.totalCost);
      setInsufficientFunds(userEthBalance < requiredEth);
    }
  }, [balances, costInfo]); // Only check funds when balance or cost changes

  // Memoize cost calculations to prevent unnecessary re-renders
  const memoizedCostDisplay = useMemo(() => {
    if (!costInfo) return null;
    
    return {
      baseCost: (parseFloat(costInfo.totalCost) / 1e18 - parseFloat(costInfo.stripeFee) / 1e18 - parseFloat(costInfo.gasFee) / 1e18).toFixed(6),
      stripeFee: (parseFloat(costInfo.stripeFee) / 1e18).toFixed(6),
      gasFee: (parseFloat(costInfo.gasFee) / 1e18).toFixed(6),
      totalCost: (parseFloat(costInfo.totalCost) / 1e18).toFixed(6),
      eurAmount: stripeService.formatEur(stripeService.convertEthToEur(parseFloat(costInfo.totalCost) / 1e18))
    };
  }, [costInfo]);

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTokenAmount(value);
      setShowPaymentForm(false);
      setSuccessMessage('');
    }
  };

  const handlePaymentMethodChange = (field: keyof PaymentMethodData, value: string) => {
    setPaymentMethod(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    handlePaymentMethodChange('cardNumber', formatted);
  };

  const handleProceedToPayment = () => {
    if (!costInfo || insufficientFunds) return;
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!costInfo || !address) return;

    setIsProcessing(true);
    setSuccessMessage('');

    try {
      // Simulate Stripe payment processing
      const eurAmount = stripeService.convertEthToEur(parseFloat(costInfo.totalCost) / 1e18);
      const paymentIntent = await stripeService.createPaymentIntent(eurAmount);
      
      const paymentResult = await stripeService.processPayment(paymentIntent.id, paymentMethod);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Process token purchase on blockchain
      const purchaseResult = await buyTokens(tokenAmount);
      
      if (purchaseResult.success) {
        setSuccessMessage(`Successfully purchased ${tokenAmount} ITC tokens! Transaction: ${purchaseResult.transactionHash}`);
        setTokenAmount('');
        setCostInfo(null);
        setShowPaymentForm(false);
        setPaymentMethod({
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvc: '',
          holderName: '',
        });
      } else {
        throw new Error(purchaseResult.error || 'Blockchain transaction failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setSuccessMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFullFillTokens = async () => {
    if (!ownerEthAmount || parseFloat(ownerEthAmount) <= 0) {
      return;
    }

    setIsProcessing(true);
    setSuccessMessage('');

    try {
      const result = await fullFillTokens(ownerEthAmount);
      
      if (result.success) {
        setSuccessMessage(`Successfully added tokens to your balance! ETH sent: ${ownerEthAmount} ETH. Transaction: ${result.transactionHash}`);
        setOwnerEthAmount('');
        setShowOwnerPanel(false);
      } else {
        throw new Error(result.error || 'Failed to fulfill tokens');
      }
    } catch (err: any) {
      console.error('FullFill tokens error:', err);
      setSuccessMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Buy ITC Tokens
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to purchase ITC tokens
          </p>
          <div className="card max-w-md mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600">
                Please connect your wallet to purchase ITC tokens
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Buy ITC Tokens
        </h1>
        <p className="text-lg text-gray-600">
          Purchase ITC tokens using EUR via Stripe payment gateway
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Purchase Successful!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                {successMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Panel */}
      {isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4 4-4-4 4-4 .257.257A6 6 0 1118 8zm-6-2a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Owner Functions
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  You are the contract owner. Add more tokens to your balance.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOwnerPanel(!showOwnerPanel)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showOwnerPanel ? 'Hide' : 'Show'} Owner Panel
            </button>
          </div>

          {showOwnerPanel && (
            <div className="border-t border-blue-200 pt-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">
                Full Fill Tokens
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ownerEthAmount" className="block text-sm font-medium text-blue-700 mb-1">
                    ETH Amount to Send
                  </label>
                  <input
                    type="text"
                    id="ownerEthAmount"
                    value={ownerEthAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setOwnerEthAmount(value);
                      }
                    }}
                    placeholder="Enter ETH amount (e.g., 1.5)"
                    className="input-field"
                    disabled={isProcessing}
                  />
                  <div className="mt-1 text-xs text-blue-600">
                    This will mint tokens to your balance based on current token price
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleFullFillTokens}
                    disabled={!ownerEthAmount || parseFloat(ownerEthAmount) <= 0 || isProcessing}
                    className="btn-primary"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      `Add Tokens (${ownerEthAmount || '0'} ETH)`
                    )}
                  </button>
                  {ownerEthAmount && priceInfo && (
                    <div className="mt-2 text-xs text-blue-600">
                      ≈ {((parseFloat(ownerEthAmount) * 1e18) / parseFloat(priceInfo.tokenPrice) / 1e18).toFixed(2)} ITC tokens
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Token Purchase Form */}
        <div className="space-y-6">
          {/* Current Balances */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Balances
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : balances ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ITC Tokens
                  </label>
                  <div className="text-lg font-semibold text-primary-600">
                    {parseFloat(balances.balanceFormatted).toFixed(2)} ITC
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ETH Balance
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {parseFloat(balances.ethBalanceFormatted).toFixed(2)} ETH
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading balances...</div>
            )}
          </div>

          {/* Purchase Form */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchase Tokens
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Token Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="tokenAmount"
                    value={tokenAmount}
                    onChange={handleTokenAmountChange}
                    placeholder="Enter amount of ITC tokens"
                    className="input-field pr-12"
                    disabled={isProcessing}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">ITC</span>
                  </div>
                </div>
              </div>

              {/* Cost Calculation */}
              {tokenAmount && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Cost Breakdown
                  </h4>
                  
                  {/* Always show the container to prevent layout shifts */}
                  <div className="space-y-2 text-sm min-h-[120px]">
                    {isCalculating ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Calculating...</span>
                          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        {/* Show previous values while calculating to prevent flashing */}
                        {memoizedCostDisplay && (
                          <div className="opacity-50 space-y-2">
                            <div className="flex justify-between">
                              <span>Token Amount:</span>
                              <span className="font-medium">{lastCalculatedAmount} ITC</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Base Cost:</span>
                              <span>{memoizedCostDisplay.baseCost} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stripe Fee:</span>
                              <span>{memoizedCostDisplay.stripeFee} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Gas Fee:</span>
                              <span>{memoizedCostDisplay.gasFee} ETH</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold">
                              <span>Total Cost:</span>
                              <span className="text-primary-600">{memoizedCostDisplay.totalCost} ETH</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : memoizedCostDisplay ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Token Amount:</span>
                          <span className="font-medium">{tokenAmount} ITC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Base Cost:</span>
                          <span>{memoizedCostDisplay.baseCost} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stripe Fee:</span>
                          <span>{memoizedCostDisplay.stripeFee} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gas Fee:</span>
                          <span>{memoizedCostDisplay.gasFee} ETH</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Cost:</span>
                          <span className="text-primary-600">{memoizedCostDisplay.totalCost} ETH</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>≈ EUR:</span>
                          <span>{memoizedCostDisplay.eurAmount}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 text-sm text-center">
                          Enter token amount to see cost breakdown
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Insufficient Funds Warning */}
              {insufficientFunds && balances && costInfo && hasCalculatedCost && !isCalculating && (
                <InsufficientFundsMessage
                  type="eth"
                  required={(parseFloat(costInfo.totalCost) / 1e18).toFixed(6)}
                  available={parseFloat(balances.ethBalanceFormatted).toFixed(6)}
                  action="purchase these tokens"
                  showBuyTokensLink={false}
                />
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!showPaymentForm ? (
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!tokenAmount || !costInfo || insufficientFunds || isCalculating || isProcessing}
                    className="btn-primary w-full"
                  >
                    {isCalculating ? 'Calculating...' : 'Proceed to Payment'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="btn-secondary w-full"
                  >
                    ← Back to Amount Selection
                  </button>
                )}

                {tokenAmount && memoizedCostDisplay && (
                  <div className="text-xs text-gray-500 text-center">
                    You will receive {tokenAmount} ITC tokens for {memoizedCostDisplay.totalCost} ETH
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Form or Token Info */}
        <div className="space-y-6">
          {showPaymentForm ? (
            /* Payment Form */
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>
              
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={paymentMethod.cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="input-field"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <select
                      id="expiryMonth"
                      value={paymentMethod.expiryMonth}
                      onChange={(e) => handlePaymentMethodChange('expiryMonth', e.target.value)}
                      className="input-field"
                      required
                      disabled={isProcessing}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      id="expiryYear"
                      value={paymentMethod.expiryYear}
                      onChange={(e) => handlePaymentMethodChange('expiryYear', e.target.value)}
                      className="input-field"
                      required
                      disabled={isProcessing}
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year.toString().slice(-2)}>
                          {year.toString().slice(-2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      value={paymentMethod.cvc}
                      onChange={(e) => handlePaymentMethodChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="input-field"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="holderName"
                    value={paymentMethod.holderName}
                    onChange={(e) => handlePaymentMethodChange('holderName', e.target.value)}
                    placeholder="John Doe"
                    className="input-field"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Payment Summary
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>{memoizedCostDisplay?.eurAmount || '€0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>You will receive:</span>
                      <span className="font-medium">{tokenAmount} ITC Tokens</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || insufficientFunds}
                  className="btn-primary w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ${memoizedCostDisplay?.eurAmount || '€0.00'}`
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Token Information */
            <div className="space-y-6">
              {/* Token Info Card */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Token Information
                </h3>
                {tokenInfo ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <div className="font-medium">{tokenInfo.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Symbol:</span>
                        <div className="font-medium">{tokenInfo.symbol}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <div className="font-medium">
                          {priceInfo ? (parseFloat(priceInfo.tokenPriceFormatted)).toFixed(6) : '0'} ETH
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Supply:</span>
                        <div className="font-medium">
                          {(parseFloat(tokenInfo.totalSupply) / 1e18).toLocaleString()} ITC
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Loading token information...</div>
                )}
              </div>

              {/* Test Cards Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Test Payment Methods
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Use these test card numbers for simulation:
                </p>
                <div className="space-y-2">
                  {stripeService.getTestCards().map((card, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="font-mono">{card.number}</span>
                      <span className="text-gray-600">{card.description}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Use any future expiry date and any 3-digit CVC.
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Amounts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['10', '50', '100', '500'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTokenAmount(amount)}
                      disabled={isProcessing}
                      className="btn-outline text-sm py-2"
                    >
                      {amount} ITC
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
