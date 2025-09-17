# E-commerce Smart Contract Platform

A complete e-commerce platform built with Solidity 0.8.20 and Foundry, featuring ERC-20 tokens, company management, and product catalog with advanced filtering capabilities.

## 🏗️ Architecture

### Contracts

1. **ITCToken20** - ERC-20 token with buy/withdraw functionality
2. **Company** - Company management system
3. **Products** - Product catalog with filtering and search

### Directory Structure

```
backend/
├── src/
│   ├── contracts/          # Smart contracts
│   │   ├── ITCToken20.sol
│   │   ├── Company.sol
│   │   └── Products.sol
│   └── interfaces/         # Contract interfaces
│       ├── IITCToken20.sol
│       ├── ICompany.sol
│       └── IProducts.sol
├── test/                   # Foundry tests
│   ├── ITCToken20.t.sol
│   ├── Company.t.sol
│   ├── Products.t.sol
│   └── Integration.t.sol
├── script/                 # Deployment scripts
│   ├── Deploy.s.sol
│   └── DeployLocal.s.sol
└── foundry.toml           # Foundry configuration
```

## 🚀 Features

### ITCToken20 (ERC-20 Token)
- ✅ Standard ERC-20 functionality
- ✅ Buy tokens with ETH
- ✅ Withdraw tokens for ETH
- ✅ Configurable token price
- ✅ Maximum supply limit (1M tokens)
- ✅ Owner minting/burning capabilities
- ✅ Reentrancy protection

### Company Management
- ✅ Create companies with name and owner
- ✅ Update company information
- ✅ Activate/deactivate companies
- ✅ Query companies by owner
- ✅ Transfer company ownership
- ✅ Comprehensive filtering and search

### Product Catalog
- ✅ Create products with company association
- ✅ Product metadata (name, price, IPFS image hash)
- ✅ Advanced filtering by company, price range, active status
- ✅ Text search functionality
- ✅ CRUD operations for products
- ✅ Company ownership validation

## 🛠️ Setup and Installation

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Anvil](https://book.getfoundry.sh/anvil/) for local development

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
forge install
```

3. Build the contracts:
```bash
forge build
```

## 🧪 Testing

Run all tests:
```bash
forge test
```

Run specific test files:
```bash
forge test --match-contract ITCToken20Test
forge test --match-contract CompanyTest
forge test --match-contract ProductsTest
forge test --match-contract IntegrationTest
```

Run tests with gas reporting:
```bash
forge test --gas-report
```

Run tests with coverage:
```bash
forge coverage
```

## 🚀 Deployment

### Local Development (Anvil)

1. Start Anvil in one terminal:
```bash
anvil
```

2. Deploy contracts locally:
```bash
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet/Mainnet Deployment

1. Set your private key as an environment variable:
```bash
export PRIVATE_KEY=your_private_key_here
```

2. Deploy to Sepolia testnet:
```bash
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

3. Deploy to mainnet:
```bash
forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify
```

## 📖 Usage Examples

### Frontend Integration

The contracts are designed to be easily integrated with frontend applications. Here are some key functions:

#### Token Operations
```solidity
// Buy tokens
ITCToken20(tokenAddress).buyTokens{value: ethAmount}(tokenAmount);

// Withdraw tokens
ITCToken20(tokenAddress).withdrawTokens(tokenAmount);

// Get token price
uint256 price = ITCToken20(tokenAddress).getTokenPrice();
```

#### Company Management
```solidity
// Create company
uint256 companyId = Company(companyAddress).createCompany("My Company");

// Get companies by owner
CompanyData[] memory companies = Company(companyAddress).getCompaniesByOwner(owner);

// Update company
Company(companyAddress).updateCompany(companyId, "New Name");
```

#### Product Operations
```solidity
// Create product
uint256 productId = Products(productsAddress).createProduct(
    companyId, 
    "Product Name", 
    price, 
    "QmIPFSHash"
);

// Search products
ProductData[] memory results = Products(productsAddress).searchProducts("search term");

// Filter products
ProductFilter memory filter = ProductFilter({
    companyId: 0,        // 0 = all companies
    minPrice: 100 ether,
    maxPrice: 1000 ether,
    isActive: true,
    searchTerm: "laptop"
});
ProductData[] memory filtered = Products(productsAddress).getProductsWithFilter(filter);
```

## 🔧 Configuration

### Foundry Configuration (foundry.toml)
- Solidity version: 0.8.20
- Optimizer enabled with 200 runs
- Fuzz testing configured
- RPC endpoints for Anvil, Sepolia, and Mainnet

### Environment Variables
- `PRIVATE_KEY`: Your wallet private key for deployment
- `ALCHEMY_API_KEY`: For RPC endpoints
- `ETHERSCAN_API_KEY`: For contract verification

## 🛡️ Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks in token operations
- **Access Control**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive validation for all inputs
- **Safe Math**: Built-in overflow/underflow protection
- **Ownership Verification**: Company owners can only manage their own entities

## 📊 Gas Optimization

- Efficient storage patterns
- Minimal external calls
- Optimized loops and iterations
- Packed structs where possible
- Events for efficient off-chain indexing

## 🔍 Monitoring and Events

All contracts emit comprehensive events for:
- Token purchases and withdrawals
- Company creation and updates
- Product management operations
- Ownership transfers
- Price updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the test files for usage examples
- Review the contract interfaces for function signatures

## 🚀 Next Steps

- [ ] Add payment processing integration
- [ ] Implement order management system
- [ ] Add product reviews and ratings
- [ ] Create admin dashboard
- [ ] Add multi-signature wallet support
- [ ] Implement upgradeable contracts