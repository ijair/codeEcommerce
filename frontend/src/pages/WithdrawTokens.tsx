import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useTokens } from '../hooks/useTokens';
import InsufficientFundsMessage from '../components/InsufficientFundsMessage';
import { withdrawalService } from '../services/withdrawalService';
import { ethers } from 'ethers';
import type { TokenWithdrawResult } from '../types/contracts';

const WithdrawTokens: React.FC = () => {
  const { isConnected, address, connectWallet, isLoading: isWalletLoading } = useWallet();
  const {
    tokenInfo,
    balances: userBalances,
    isLoading: isTokensLoading,
    error: tokensError,
    withdrawTokens,
    calculateWithdrawTokensNet,
  } = useTokens();

  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [netInfo, setNetInfo] = useState<{ netAmount: string; stripeFee: string; gasFee: string } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<TokenWithdrawResult | null>(null);
  const [insufficientTokens, setInsufficientTokens] = useState(false);
  
  // Additional withdrawal form fields
  const [withdrawalMethod, setWithdrawalMethod] = useState<'eth_wallet' | 'bank_transfer'>('eth_wallet');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
  });
  const [ethWalletAddress, setEthWalletAddress] = useState<string>('');
  const [confirmWithdrawal, setConfirmWithdrawal] = useState(false);

  const isLoading = isWalletLoading || isTokensLoading;

  // Reset state when wallet address changes
  useEffect(() => {
    setTokenAmount('');
    setNetInfo(null);
    setInsufficientTokens(false);
    setWithdrawStatus(null);
    setEthWalletAddress(address || ''); // Auto-fill with connected wallet
    setConfirmWithdrawal(false);
    setBankDetails({
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swiftCode: '',
    });
  }, [address]);

  // Calculate net amount when token amount changes
  useEffect(() => {
    const calculateNet = async () => {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
        setNetInfo(null);
        setInsufficientTokens(false);
        return;
      }

      setIsCalculating(true);
      try {
        const net = await calculateWithdrawTokensNet(tokenAmount);
        setNetInfo(net);
        
        // Check if user has enough tokens
        if (userBalances && net && userBalances.balance) {
          const userTokenBalance = BigInt(userBalances.balance);
          const requiredTokens = ethers.parseEther(tokenAmount);
          setInsufficientTokens(userTokenBalance < requiredTokens);
        } else {
          setInsufficientTokens(false);
        }
      } catch (err) {
        console.error('Error calculating net amount:', err);
        setNetInfo(null);
        setInsufficientTokens(false);
      } finally {
        setIsCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateNet, 500);
    return () => clearTimeout(debounceTimer);
  }, [tokenAmount, userBalances, calculateWithdrawTokensNet]);

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTokenAmount(value);
      setWithdrawStatus(null);
    }
  };

  const handleWithdrawTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!isConnected || !address || !netInfo || parseFloat(tokenAmount) <= 0 || insufficientTokens) {
      setWithdrawStatus({ success: false, message: 'Please check your token amount and balance.' });
      return;
    }

    // Validate withdrawal method specific fields
    if (withdrawalMethod === 'eth_wallet') {
      if (!ethWalletAddress || !ethers.isAddress(ethWalletAddress)) {
        setWithdrawStatus({ success: false, message: 'Please enter a valid Ethereum wallet address.' });
        return;
      }
    } else if (withdrawalMethod === 'bank_transfer') {
      if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber) {
        setWithdrawStatus({ success: false, message: 'Please fill in all required bank details.' });
        return;
      }
    }

    // Confirmation checkbox validation
    if (!confirmWithdrawal) {
      setWithdrawStatus({ success: false, message: 'Please confirm that you want to proceed with the withdrawal.' });
      return;
    }

    setIsProcessing(true);
    setWithdrawStatus(null);

    try {
      // Prepare withdrawal data
      const withdrawalData = {
        tokenAmount,
        withdrawalMethod,
        destinationAddress: withdrawalMethod === 'eth_wallet' ? ethWalletAddress : undefined,
        bankDetails: withdrawalMethod === 'bank_transfer' ? bankDetails : undefined,
        userAddress: address,
        netAmount: netInfo.netAmount,
        fees: {
          stripeFee: netInfo.stripeFee,
          gasFee: netInfo.gasFee,
        }
      };

      console.log('Processing withdrawal with data:', withdrawalData);

      // Record withdrawal request in backend first
      const recordResult = await withdrawalService.recordWithdrawal(withdrawalData);
      if (!recordResult.success) {
        console.warn('Failed to record withdrawal:', recordResult.error);
      }

      // Call the blockchain withdrawal function
      const result = await withdrawTokens(tokenAmount);
      
      if (result.success && recordResult.recordId) {
        // Update withdrawal status to completed
        try {
          await withdrawalService.updateWithdrawalStatus(
            recordResult.recordId, 
            'completed', 
            result.transactionHash
          );
        } catch (recordError) {
          console.warn('Failed to update withdrawal status:', recordError);
          // Don't fail the entire process if status update fails
        }
      } else if (recordResult.recordId) {
        // Mark as failed if blockchain transaction failed
        try {
          await withdrawalService.updateWithdrawalStatus(recordResult.recordId, 'failed');
        } catch (recordError) {
          console.warn('Failed to update withdrawal status to failed:', recordError);
        }
      }
      
      setWithdrawStatus(result);
      
      if (result.success) {
        // Reset form on success
        setTokenAmount('');
        setNetInfo(null);
        setConfirmWithdrawal(false);
        if (withdrawalMethod === 'bank_transfer') {
          setBankDetails({
            accountHolderName: '',
            bankName: '',
            accountNumber: '',
            routingNumber: '',
            swiftCode: '',
          });
        }
      }
    } catch (error: any) {
      console.error('Error during token withdrawal:', error);
      setWithdrawStatus({ 
        success: false, 
        message: 'An unexpected error occurred during withdrawal.', 
        error: error.message 
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const setMaxAmount = () => {
    if (userBalances && userBalances.balanceFormatted) {
      setTokenAmount(userBalances.balanceFormatted);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet to Withdraw Tokens</h2>
        <p className="text-lg text-gray-600 mb-6">Please connect your MetaMask wallet to access the token withdrawal functionality.</p>
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
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Withdraw ITC Tokens</h1>

      {isLoading && <p className="text-center text-gray-600">Loading token data and balances...</p>}
      {tokensError && <p className="text-center text-red-500">Error: {tokensError}</p>}

      {/* Debug info */}
      {!isLoading && (
        <div className="text-center text-sm text-gray-500 mb-4">
          Debug: tokenInfo={tokenInfo ? 'loaded' : 'null'}, userBalances={userBalances ? 'loaded' : 'null'}, isLoading={isLoading.toString()}
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Balances */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Balances</h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  <strong>ITC Tokens:</strong> {userBalances ? userBalances.balanceFormatted : '0'} {tokenInfo?.symbol || 'ITC'}
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  <strong>ETH Balance:</strong> {userBalances ? userBalances.ethBalanceFormatted : '0'} ETH
                </p>
              </>
            )}
            
            {userBalances && parseFloat(userBalances.balanceFormatted) === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="text-sm">
                  You don't have any ITC tokens to withdraw. 
                  <a href="/tokens" className="font-bold underline ml-1">Purchase tokens here</a>.
                </p>
              </div>
            )}

            {/* Insufficient Tokens Warning */}
            {insufficientTokens && userBalances && tokenAmount && parseFloat(tokenAmount) > 0 && (
              <InsufficientFundsMessage
                type="tokens"
                required={tokenAmount}
                available={userBalances.balanceFormatted}
                action="withdraw"
                showBuyTokensLink={true}
              />
            )}
          </div>

          {/* Withdraw Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Withdraw Tokens</h2>
            <form onSubmit={handleWithdrawTokens}>
              <div className="mb-4">
                <label htmlFor="tokenAmount" className="block text-gray-700 text-sm font-bold mb-2">
                  Amount of ITC Tokens to Withdraw:
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="tokenAmount"
                    value={tokenAmount}
                    onChange={handleTokenAmountChange}
                    className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 100"
                    required
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={setMaxAmount}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r transition duration-200"
                    disabled={isProcessing || !userBalances}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6 flex space-x-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTokenAmount(amount.toString())}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold py-1 px-3 rounded-full transition duration-200"
                    disabled={isProcessing}
                  >
                    {amount} ITC
                  </button>
                ))}
              </div>

              {/* Withdrawal Method Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-3">
                  Withdrawal Method:
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="eth_wallet"
                      name="withdrawalMethod"
                      value="eth_wallet"
                      checked={withdrawalMethod === 'eth_wallet'}
                      onChange={(e) => setWithdrawalMethod(e.target.value as 'eth_wallet')}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                      disabled={isProcessing}
                    />
                    <label htmlFor="eth_wallet" className="text-gray-700">
                      <span className="font-medium">Direct to ETH Wallet</span>
                      <span className="block text-sm text-gray-500">Receive ETH directly to your wallet (Recommended)</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="bank_transfer"
                      name="withdrawalMethod"
                      value="bank_transfer"
                      checked={withdrawalMethod === 'bank_transfer'}
                      onChange={(e) => setWithdrawalMethod(e.target.value as 'bank_transfer')}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                      disabled={isProcessing}
                    />
                    <label htmlFor="bank_transfer" className="text-gray-700">
                      <span className="font-medium">Bank Transfer</span>
                      <span className="block text-sm text-gray-500">Receive fiat currency via bank transfer (Higher fees)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ETH Wallet Address Field */}
              {withdrawalMethod === 'eth_wallet' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label htmlFor="ethWalletAddress" className="block text-gray-700 text-sm font-bold mb-2">
                    Destination ETH Wallet Address:
                  </label>
                  <input
                    type="text"
                    id="ethWalletAddress"
                    value={ethWalletAddress}
                    onChange={(e) => setEthWalletAddress(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                    placeholder="0x..."
                    required
                    disabled={isProcessing}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    ETH will be sent directly to this address. Make sure it's correct!
                  </p>
                  {address && ethWalletAddress !== address && (
                    <button
                      type="button"
                      onClick={() => setEthWalletAddress(address)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
                      disabled={isProcessing}
                    >
                      Use connected wallet address ({address.slice(0, 6)}...{address.slice(-4)})
                    </button>
                  )}
                </div>
              )}

              {/* Bank Details Fields */}
              {withdrawalMethod === 'bank_transfer' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Bank Account Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="accountHolderName" className="block text-gray-700 text-sm font-bold mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        id="accountHolderName"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="John Doe"
                        required
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bankName" className="block text-gray-700 text-sm font-bold mb-2">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Bank of America"
                        required
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="accountNumber" className="block text-gray-700 text-sm font-bold mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="123456789"
                        required
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="routingNumber" className="block text-gray-700 text-sm font-bold mb-2">
                        Routing Number
                      </label>
                      <input
                        type="text"
                        id="routingNumber"
                        value={bankDetails.routingNumber}
                        onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="021000021"
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="swiftCode" className="block text-gray-700 text-sm font-bold mb-2">
                        SWIFT/BIC Code (for international transfers)
                      </label>
                      <input
                        type="text"
                        id="swiftCode"
                        value={bankDetails.swiftCode}
                        onChange={(e) => setBankDetails({...bankDetails, swiftCode: e.target.value})}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="BOFAUS3N"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Bank transfers may take 3-5 business days to process and may incur additional fees.
                      Processing time and fees depend on your bank and location.
                    </p>
                  </div>
                </div>
              )}

              {/* Net Amount Calculation */}
              {tokenAmount && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Withdrawal Breakdown:</h3>
                  
                  {isCalculating ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : netInfo ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tokens to Withdraw:</span>
                        <span className="font-medium">{tokenAmount} ITC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gross ETH Amount:</span>
                        <span>{(parseFloat(ethers.formatEther(netInfo.netAmount)) + parseFloat(ethers.formatEther(netInfo.stripeFee)) + parseFloat(ethers.formatEther(netInfo.gasFee))).toFixed(6)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stripe Fee:</span>
                        <span>-{(parseFloat(ethers.formatEther(netInfo.stripeFee))).toFixed(6)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gas Fee:</span>
                        <span>-{(parseFloat(ethers.formatEther(netInfo.gasFee))).toFixed(6)} ETH</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Net ETH Received:</span>
                        <span className="text-green-600">{(parseFloat(ethers.formatEther(netInfo.netAmount))).toFixed(6)} ETH</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Enter token amount to see withdrawal breakdown
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Checkbox */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="confirmWithdrawal"
                    checked={confirmWithdrawal}
                    onChange={(e) => setConfirmWithdrawal(e.target.checked)}
                    className="mt-1 mr-3 text-red-600 focus:ring-red-500"
                    disabled={isProcessing}
                  />
                  <label htmlFor="confirmWithdrawal" className="text-sm text-gray-700">
                    <span className="font-medium text-red-800">I confirm that I want to withdraw {tokenAmount || '0'} ITC tokens.</span>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p>• I understand that this action cannot be undone</p>
                      <p>• I have verified the destination address/bank details are correct</p>
                      <p>• I understand the fees and net amount I will receive</p>
                      {withdrawalMethod === 'bank_transfer' && (
                        <p>• I understand bank transfers may take 3-5 business days</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out ${
                  isProcessing || insufficientTokens || !netInfo || parseFloat(tokenAmount) <= 0 || !confirmWithdrawal ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isProcessing || insufficientTokens || !netInfo || parseFloat(tokenAmount) <= 0 || !confirmWithdrawal}
              >
                {isProcessing ? 'Processing Withdrawal...' : 'Withdraw Tokens'}
              </button>

              {withdrawStatus && (
                <div className={`mt-4 p-3 rounded-md ${withdrawStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {withdrawStatus.message} {withdrawStatus.error && `Error: ${withdrawStatus.error}`}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Information</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-2 text-sm">
          <li>Token withdrawals convert your ITC tokens back to ETH at the current rate (1 ITC = 0.001 ETH)</li>
          <li>Withdrawal fees include a small Stripe processing fee and estimated gas costs</li>
          <li>The net amount shown is what you'll receive in your wallet after all fees</li>
          <li>Withdrawals are processed immediately on the blockchain</li>
          <li>Make sure you have enough ETH in your wallet to cover transaction gas fees</li>
        </ul>
      </div>
    </div>
  );
};

export default WithdrawTokens;
