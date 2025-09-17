export interface CompanyData {
  owner: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductData {
  id: number;
  companyId: number;
  name: string;
  price: string; // BigNumber as string
  image: string;
  stock: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ClientData {
  clientAddress: string;
  companyId: number;
  totalPurchases: number;
  totalSpent: string; // BigNumber as string
  invoiceCount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceData {
  id: number;
  companyId: number;
  number: number;
  date: number;
  clientAddress: string;
  totalAmount: string; // BigNumber as string
  isPaid: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceItem {
  productId: number;
  quantity: number;
  unitPrice: string; // BigNumber as string
  totalPrice: string; // BigNumber as string
}

export interface TokenFees {
  totalCost: string; // BigNumber as string
  stripeFee: string; // BigNumber as string
  gasFee: string; // BigNumber as string
}

export interface TokenWithdrawFees {
  netAmount: string; // BigNumber as string
  stripeFee: string; // BigNumber as string
  gasFee: string; // BigNumber as string
}

export interface TokenBalance {
  balance: string; // BigNumber as string
  balanceFormatted: string;
  ethBalance: string; // BigNumber as string
  ethBalanceFormatted: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  price: string; // BigNumber as string
  maxSupply: string;
  remainingSupply: string;
}

export interface TokenPurchaseResult {
  success: boolean;
  message?: string;
  error?: string;
  transactionHash?: string;
}

export interface TokenWithdrawResult {
  success: boolean;
  message?: string;
  error?: string;
  transactionHash?: string;
}

export interface StripeFeeConfig {
  fixedFee: string; // BigNumber as string
  percentageFee: string; // BigNumber as string
}

export interface GasFeeEstimate {
  gasFee: string; // BigNumber as string
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
}

export interface ContractAddresses {
  ITCToken20: string;
  Company: string;
  Products: string;
  Invoice: string;
  Clients: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  network: NetworkConfig | null;
  error: string | null;
}
