import { Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Contract ABIs (simplified for demo - in production, import from compiled artifacts)
export const CONTRACT_ABIS = {
  ITCToken20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)',
    'function transferFrom(address, address, uint256) returns (bool)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
    'function buyTokens() payable',
    'function withdrawTokens(uint256)',
    'function getTokenPrice() view returns (uint256)',
    'function setTokenPrice(uint256)',
    'function calculateBuyTokensCost(uint256) view returns (uint256, uint256, uint256)',
    'function calculateWithdrawTokensNet(uint256) view returns (uint256, uint256, uint256)',
    'function getStripeFeeConfig() view returns (uint256, uint256)',
    'function getGasFeeEstimate() view returns (uint256)',
    'function setStripeFeeConfig(uint256, uint256)',
    'function setGasFeeEstimate(uint256)',
    'function getMaxSupply() view returns (uint256)',
    'function getRemainingSupply() view returns (uint256)',
    'function getContractBalance() view returns (uint256)',
    'function fullFillTokens() payable',
    'function owner() view returns (address)',
    'function mint(address, uint256)',
    'function burn(address, uint256)',
    'function withdrawETH(uint256)',
    'function withdrawAllETH()',
    'event TokensPurchased(address indexed, uint256, uint256)',
    'event TokensWithdrawn(address indexed, uint256, uint256)',
    'event TokenPriceUpdated(uint256)',
  ],
  
  Company: [
    'function createCompany(string memory name) returns (uint256)',
    'function createCompanyForOwner(string memory name, address owner) returns (uint256)',
    'function updateCompany(uint256 companyId, string memory newName) returns (bool)',
    'function deactivateCompany(uint256 companyId) returns (bool)',
    'function reactivateCompany(uint256 companyId) returns (bool)',
    'function transferCompanyOwnership(uint256 companyId, address newOwner)',
    'function getCompany(uint256 companyId) view returns (tuple(address owner, string name, bool isActive, uint256 createdAt, uint256 updatedAt))',
    'function getAllCompanies() view returns (tuple(address owner, string name, bool isActive, uint256 createdAt, uint256 updatedAt)[])',
    'function getCompaniesByOwner(address ownerAddress) view returns (tuple(address owner, string name, bool isActive, uint256 createdAt, uint256 updatedAt)[])',
    'function getActiveCompanies() view returns (tuple(address owner, string name, bool isActive, uint256 createdAt, uint256 updatedAt)[])',
    'function isCompanyOwner(uint256 companyId, address potentialOwner) view returns (bool)',
    'function getCompanyIdByName(string memory name) view returns (uint256)',
    'function getCompanyCount() view returns (uint256)',
    'event CompanyCreated(uint256 indexed id, address indexed owner, string name)',
    'event CompanyUpdated(uint256 indexed id, string newName)',
    'event CompanyDeactivated(uint256 indexed id)',
    'event CompanyReactivated(uint256 indexed id)',
    'event CompanyOwnershipTransferred(uint256 indexed companyId, address indexed oldOwner, address indexed newOwner)',
  ],

  Products: [
    'function createProduct(uint256 companyId, string memory name, uint256 price, string memory image, uint256 stock) returns (uint256)',
    'function createProductForCompany(uint256 companyId, string memory name, uint256 price, string memory image, uint256 stock) returns (uint256)',
    'function updateProduct(uint256 productId, string memory name, uint256 price, string memory image)',
    'function deactivateProduct(uint256 productId)',
    'function reactivateProduct(uint256 productId)',
    'function getProduct(uint256 productId) view returns (tuple(uint256 id, uint256 companyId, string name, uint256 price, string image, uint256 stock, uint256 createdAt, uint256 updatedAt, bool isActive))',
    'function getAllProducts() view returns (tuple(uint256 id, uint256 companyId, string name, uint256 price, string image, uint256 stock, uint256 createdAt, uint256 updatedAt, bool isActive)[])',
    'function getProductsByCompany(uint256 companyId) view returns (tuple(uint256 id, uint256 companyId, string name, uint256 price, string image, uint256 stock, uint256 createdAt, uint256 updatedAt, bool isActive)[])',
    'function getActiveProducts() view returns (tuple(uint256 id, uint256 companyId, string name, uint256 price, string image, uint256 stock, uint256 createdAt, uint256 updatedAt, bool isActive)[])',
    'function getProductsWithFilter(string memory filter) view returns (tuple(uint256 id, uint256 companyId, string name, uint256 price, string image, uint256 stock, uint256 createdAt, uint256 updatedAt, bool isActive)[])',
    'function updateProductStock(uint256 productId, uint256 quantity)',
    'function addProductStock(uint256 productId, uint256 quantity)',
    'function purchaseProduct(uint256 productId, uint256 quantity)',
    'function completePurchase(uint256 productId, uint256 quantity, address clientAddress, uint256 purchaseAmount)',
    'function getProductStock(uint256 productId) view returns (uint256)',
    'function hasStockAvailable(uint256 productId, uint256 quantity) view returns (bool)',
    'function authorizeContract(address contractAddress)',
    'function revokeContractAuthorization(address contractAddress)',
    'function getProductCount() view returns (uint256)',
    'event ProductCreated(uint256 indexed id, uint256 indexed companyId, string name, uint256 price, uint256 stock)',
    'event ProductUpdated(uint256 indexed id, string name, uint256 price, string image)',
    'event ProductDeactivated(uint256 indexed id)',
    'event ProductReactivated(uint256 indexed id)',
    'event ProductStockUpdated(uint256 indexed productId, uint256 newStock)',
  ],

  Invoice: [
    'function createInvoice(uint256, uint256, address, uint256) returns (uint256)',
    'function createInvoiceWithProducts(uint256 companyId, uint256 number, address clientAddress, tuple(uint256 productId, uint256 quantity, uint256 unitPrice, uint256 totalPrice)[] items, bool useTokens) returns (uint256)',
    'function updateInvoice(uint256, uint256)',
    'function markInvoiceAsPaid(uint256)',
    'function getInvoice(uint256 invoiceId) view returns (tuple(uint256 id, uint256 companyId, uint256 number, uint256 date, address clientAddress, uint256 totalAmount, bool isPaid, uint256 createdAt, uint256 updatedAt))',
    'function getInvoiceItems(uint256 invoiceId) view returns (tuple(uint256 productId, uint256 quantity, uint256 unitPrice, uint256 totalPrice)[])',
    'function getAllInvoices() view returns (tuple(uint256, uint256, uint256, uint256, address, uint256, bool, uint256, uint256)[])',
    'function getInvoicesByCompany(uint256) view returns (tuple(uint256, uint256, uint256, uint256, address, uint256, bool, uint256, uint256)[])',
    'function getInvoicesByClient(address) view returns (tuple(uint256, uint256, uint256, uint256, address, uint256, bool, uint256, uint256)[])',
    'function invoiceExists(uint256) view returns (bool)',
    'function getInvoiceCount() view returns (uint256)',
    'event InvoiceCreated(uint256 indexed, uint256 indexed, uint256, address indexed, uint256)',
    'event InvoiceUpdated(uint256 indexed, uint256)',
    'event InvoicePaid(uint256 indexed)',
  ],

  Clients: [
    'function registerClientPurchase(uint256, address, uint256)',
    'function deactivateClient(uint256, address)',
    'function reactivateClient(uint256, address)',
    'function getClient(uint256, address) view returns (tuple(address, uint256, uint256, uint256, uint256, bool, uint256, uint256))',
    'function getClientsByCompany(uint256) view returns (tuple(address, uint256, uint256, uint256, uint256, bool, uint256, uint256)[])',
    'function getActiveClientsByCompany(uint256) view returns (tuple(address, uint256, uint256, uint256, uint256, bool, uint256, uint256)[])',
    'function clientExists(uint256, address) view returns (bool)',
    'function isClientActive(uint256, address) view returns (bool)',
    'function getClientCountByCompany(uint256) view returns (uint256)',
    'function getClientCompanies(address) view returns (uint256[])',
    'event ClientRegistered(address indexed, uint256 indexed)',
    'event ClientPurchase(address indexed, uint256 indexed, uint256)',
    'event ClientDeactivated(address indexed, uint256 indexed)',
    'event ClientReactivated(address indexed, uint256 indexed)',
  ],
};

class ContractService {
  private signer: JsonRpcSigner | null = null;
  private contracts: Record<string, Contract> = {};
  private currentNetwork: string = 'local';

  /**
   * Initialize contract service with provider and signer
   */
  async initialize(_provider: BrowserProvider, signer: JsonRpcSigner, networkKey: string = 'local') {
    this.signer = signer;
    this.currentNetwork = networkKey;
    
    // Initialize contracts
    await this.initializeContracts();
  }

  /**
   * Initialize all contract instances
   */
  private async initializeContracts() {
    if (!this.signer) return;

    const addresses = CONTRACT_ADDRESSES[this.currentNetwork as keyof typeof CONTRACT_ADDRESSES];
    
    try {
      this.contracts = {
        token: new Contract(addresses.ITCToken20, CONTRACT_ABIS.ITCToken20, this.signer),
        company: new Contract(addresses.Company, CONTRACT_ABIS.Company, this.signer),
        products: new Contract(addresses.Products, CONTRACT_ABIS.Products, this.signer),
        invoice: new Contract(addresses.Invoice, CONTRACT_ABIS.Invoice, this.signer),
        clients: new Contract(addresses.Clients, CONTRACT_ABIS.Clients, this.signer),
      };
    } catch (error) {
      console.error('Error initializing contracts:', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   */
  getContract(contractName: string): Contract | null {
    return this.contracts[contractName] || null;
  }

  /**
   * Get all contract instances
   */
  getContracts() {
    return this.contracts;
  }

  /**
   * Check if contracts are initialized
   */
  isInitialized(): boolean {
    return Object.keys(this.contracts).length > 0;
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  /**
   * Switch network and reinitialize contracts
   */
  async switchNetwork(networkKey: string, newProvider: BrowserProvider, signer: JsonRpcSigner) {
    await this.initialize(newProvider, signer, networkKey);
  }
}

// Export singleton instance
export const contractService = new ContractService();
