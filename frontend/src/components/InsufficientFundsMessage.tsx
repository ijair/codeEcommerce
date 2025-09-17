import React from 'react';

interface InsufficientFundsMessageProps {
  type: 'eth' | 'tokens';
  required: string;
  available: string;
  action?: string;
  onClose?: () => void;
  showBuyTokensLink?: boolean;
}

const InsufficientFundsMessage: React.FC<InsufficientFundsMessageProps> = ({
  type,
  required,
  available,
  action = 'complete this transaction',
  onClose,
  showBuyTokensLink = true,
}) => {
  const isEth = type === 'eth';
  const currency = isEth ? 'ETH' : 'ITC Tokens';
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Insufficient {currency}
          </h3>
          
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-2">
              You don't have enough {currency} to {action}.
            </p>
            
            <div className="bg-red-100 rounded-md p-3 mb-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Required:</span>
                  <div className="font-mono">{required} {currency}</div>
                </div>
                <div>
                  <span className="font-medium">Available:</span>
                  <div className="font-mono">{available} {currency}</div>
                </div>
              </div>
            </div>

            {isEth ? (
              <div className="space-y-2">
                <p className="font-medium">To resolve this issue:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Add more ETH to your wallet</li>
                  <li>Get test ETH from a faucet (if on testnet)</li>
                  <li>Reduce the transaction amount</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">To resolve this issue:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Purchase more ITC tokens</li>
                  <li>Reduce the transaction amount</li>
                </ul>
                
                {showBuyTokensLink && (
                  <div className="mt-3">
                    <a 
                      href="/tokens" 
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Buy ITC Tokens
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsufficientFundsMessage;
