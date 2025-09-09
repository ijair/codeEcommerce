# E-commerce Platform - Solidity Smart Contracts

A comprehensive e-commerce platform built with Solidity, integrating Hardhat and Foundry for development, testing, and deployment. The platform includes a custom ERC20 token (ITC), Stripe integration for EUR conversions, and complete e-commerce functionality.

## 🏗️ Architecture

The platform consists of the following main components:

### Core Contracts

1. **ITCToken** - Custom ERC20 token for platform payments
2. **Company** - Company/merchant management
3. **Product** - Product catalog and inventory management
4. **Invoice** - Invoice generation and tracking
5. **Client** - Customer management and loyalty system
7. **Ecommerce** - Main orchestrator contract

### Entity Relationships

```
COMPANY (Company)
├── Address: Company wallet address
├── Name: Company name
├── Products: Multiple PRODUCT entities
├── Invoices: Multiple INVOICE entities
└── Clients: Multiple CLIENT entities

PRODUCT (Product)
├── AddressEmpresa: Company address
├── Id: Unique product identifier
├── Name: Product name
├── Price: Price in ITC tokens
└── Image: Product image URL/IPFS hash

INVOICE (Invoice)
├── AddressEmpresa: Company address
├── Number: Invoice number
├── Date: Creation date
├── AddressClient: Customer address
└── purchaseTotal: Total amount in ITC tokens

CLIENT (Customer)
├── AddressCompany: Company address
├── AddressClient: Customer wallet address
└── purchaseTotals: Total purchases in ITC tokens
```

## 🚀 Features

### Payment System
- **ITC Token**: Custom ERC20 token (1 EUR = 100 ITC tokens)
- **Fee Structure**: Entry fees (2.5%), exit fees (3%), gas fees (0.5%)
- **Platform Fees**: 1% platform fee on all transactions

### E-commerce Functionality
- **Multi-tenant**: Multiple companies can operate on the platform
- **Product Management**: Create, update, and manage product catalogs
- **Inventory Tracking**: Real-time stock management
- **Invoice Generation**: Automatic invoice creation and payment tracking
- **Customer Management**: Registration, purchase history, and loyalty points

### Security Features
- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Protection**: All state-changing functions protected
- **Pausable Contracts**: Emergency stop functionality
- **Input Validation**: Comprehensive parameter validation

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:ijair/codeEcommerce-backend.git
   cd codeEcommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Foundry** (if not already installed)
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   source ~/.bashrc  # or ~/.zshrc
   foundryup
   ```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Network Configuration
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key


# Treasury Address
TREASURY_ADDRESS=your_treasury_wallet_address
```

## 📋 Available Scripts

### Development
```bash
# Compile contracts
npm run compile

# Run tests (Hardhat)
npm run test

# Run tests (Foundry)
npm run test:foundry

# Start local node
npm run node

# Clean build artifacts
npm run clean
```

### Deployment
```bash
# Deploy to local network
npm run deploy:local

# Deploy to Hardhat network
npm run deploy:hardhat

# Setup initial data
npm run setup:local
npm run setup:hardhat
```

### Analysis
```bash
# Gas usage report
npm run gas-report

# Contract size analysis
npm run size

# Code coverage
npm run coverage

# Linting
npm run lint
npm run lint:fix
```

## 🧪 Testing

The project includes comprehensive test suites for both Hardhat and Foundry:

### Hardhat Tests
```bash
npm run test
```

### Foundry Tests
```bash
npm run test:foundry
```

### Test Coverage
```bash
npm run coverage
```

## 🚀 Deployment

### Local Development

1. **Start local node**
   ```bash
   npm run node
   ```

2. **Deploy contracts**
   ```bash
   npm run deploy:local
   ```

3. **Setup initial data**
   ```bash
   npm run setup:local
   ```

### Production Deployment

1. **Configure network in hardhat.config.js**
2. **Set environment variables**
3. **Deploy contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

## 💰 Token Economics

### ITC Token
- **Total Supply**: 1,000,000,000 ITC tokens
- **Decimals**: 18
- **Exchange Rate**: 1 EUR = 100 ITC tokens
- **Symbol**: ITC
- **Name**: ITC Token

### Fee Structure
- **Entry Fee**: 2.5% (EUR → ITC)
- **Exit Fee**: 3% (ITC → EUR)
- **Gas Fee**: 0.5% (both directions)
- **Platform Fee**: 1% (on purchases)

## 🔧 Configuration

### Contract Parameters

#### ITCToken
- Maximum supply: 1 billion tokens
- EUR to ITC rate: 10:1

#### StripeIntegration
- Entry fee: 250 basis points (2.5%)
- Exit fee: 300 basis points (3%)
- Gas fee: 50 basis points (0.5%)
- Min transaction: 1 EUR
- Max transaction: 10,000 EUR

#### Ecommerce
- Platform fee: 100 basis points (1%)

## 📊 Monitoring and Analytics

### Platform Statistics
- Total companies registered
- Total products created
- Total invoices generated
- Total clients registered

### Empresa Statistics
- Product count
- Invoice count
- Client count
- Total revenue

### Customer Analytics
- Purchase history
- Loyalty points
- Total spending
- Top customers

## 🔒 Security Considerations

### Access Control
- Owner-only functions for critical operations
- Role-based permissions for company operations
- Client registration requirements

### Financial Security
- Reentrancy protection on all state changes
- Input validation for all parameters
- Fee calculation verification
- Token transfer safety checks

### Operational Security
- Pausable contracts for emergency stops
- Upgradeable contract architecture
- Event logging for all transactions
- Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples

## 🔮 Future Enhancements

- [ ] Multi-signature wallet integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app integration
- [ ] Cross-chain compatibility
- [ ] NFT product support
- [ ] Subscription management
- [ ] Advanced loyalty programs
- [ ] Automated market making

---

**Built with ❤️ using Solidity, Hardhat, and Foundry**