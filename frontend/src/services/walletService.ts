import { ethers } from 'ethers';
import type { NetworkConfig, WalletState } from '../types/contracts';

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  local: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private listeners: ((state: WalletState) => void)[] = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize MetaMask event listeners
   */
  private initializeEventListeners() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(callback: (state: WalletState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(state: WalletState) {
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet(): Promise<WalletState> {
    try {
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get wallet state
      const state = await this.getWalletState();
      this.notifyListeners(state);
      
      return state;
    } catch (error: any) {
      const errorState: WalletState = {
        isConnected: false,
        address: null,
        balance: null,
        network: null,
        error: error.message || 'Failed to connect wallet',
      };
      this.notifyListeners(errorState);
      return errorState;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    
    const state: WalletState = {
      isConnected: false,
      address: null,
      balance: null,
      network: null,
      error: null,
    };
    
    this.notifyListeners(state);
  }

  /**
   * Get current wallet state
   */
  async getWalletState(): Promise<WalletState> {
    try {
      // Check if MetaMask is available
      if (!this.isMetaMaskInstalled()) {
        return {
          isConnected: false,
          address: null,
          balance: null,
          network: null,
          error: 'MetaMask is not installed',
        };
      }

      // Check if we have existing provider and signer
      if (!this.provider || !this.signer) {
        // Try to reconnect if MetaMask is available
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            // Reinitialize provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
          } else {
            return {
              isConnected: false,
              address: null,
              balance: null,
              network: null,
              error: null,
            };
          }
        } catch (reconnectError) {
          return {
            isConnected: false,
            address: null,
            balance: null,
            network: null,
            error: null,
          };
        }
      }

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      const networkConfig = Object.values(NETWORKS).find(
        n => n.chainId === Number(network.chainId)
      );

      return {
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        network: networkConfig || {
          chainId: Number(network.chainId),
          name: network.name || 'Unknown',
          rpcUrl: '',
        },
        error: null,
      };
    } catch (error: any) {
      // Reset provider and signer on error
      this.provider = null;
      this.signer = null;
      
      return {
        isConnected: false,
        address: null,
        balance: null,
        network: null,
        error: error.message || 'Failed to get wallet state',
      };
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(networkKey: string): Promise<void> {
    const network = NETWORKS[networkKey];
    if (!network) {
      throw new Error(`Network ${networkKey} not found`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await this.addNetwork(network);
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Add network to MetaMask
   */
  private async addNetwork(network: NetworkConfig): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: network.blockExplorer ? [network.blockExplorer] : [],
        },
      ],
    });
  }

  /**
   * Get current provider
   */
  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  /**
   * Get current signer
   */
  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  /**
   * Handle account changes
   */
  private async handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      await this.disconnectWallet();
    } else {
      const state = await this.getWalletState();
      this.notifyListeners(state);
    }
  }

  /**
   * Handle chain changes
   */
  private async handleChainChanged(_chainId: string) {
    // Reload the page to reset the application state
    window.location.reload();
  }

  /**
   * Handle disconnect
   */
  private async handleDisconnect() {
    await this.disconnectWallet();
  }
}

// Export singleton instance
export const walletService = new WalletService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
