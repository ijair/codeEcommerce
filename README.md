# 🛒 E-commerce Blockchain Platform

A complete decentralized e-commerce platform built with **Solidity**, **React**, **TypeScript**, and **Foundry**. This project demonstrates the implementation of a modern e-commerce system using blockchain technology, with advanced features for company management, products, clients, invoicing, and tokens.

## 🎯 Project Vision

This project was developed as part of a blockchain development course, demonstrating best practices in:

- **Smart Contract Development** with Solidity 0.8.20
- **Modern Frontend** with React and TypeScript
- **Blockchain Integration** with ethers.js
- **Decentralized Architecture** and gas optimization
- **Optimized UX/UI** for Web3 applications

## 🏗️ System Architecture

### Complete Technology Stack

#### 🔗 Backend (Blockchain)
- **Solidity 0.8.20** - Smart contract language
- **Foundry** - Development and testing framework
- **OpenZeppelin** - Secure contract libraries
- **Anvil** - Local development network
- **Forge** - Compiler and test runner

#### 🎨 Frontend (Web3)
- **React 18** - Modern UI library
- **TypeScript** - Static typing
- **Vite** - Ultra-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Ethers.js** - Blockchain interaction
- **React Router** - SPA navigation
- **Zustand** - State management

#### 🛠️ Development Tools
- **MetaMask** - User wallet
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 📁 Project Structure

```
codeEcommerce/
├── backend/                    # Smart Contracts
│   ├── src/
│   │   ├── contracts/         # Main contracts
│   │   │   ├── ITCToken20.sol
│   │   │   ├── Company.sol
│   │   │   ├── Products.sol
│   │   │   ├── Invoice.sol
│   │   │   └── Clients.sol
│   │   └── interfaces/        # Contract interfaces
│   ├── test/                  # Comprehensive tests
│   ├── script/                # Deployment scripts
│   └── deploy_contracts.sh    # Automated deployment
├── frontend/                   # Web Application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Application pages
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Integration services
│   │   ├── types/             # TypeScript definitions
│   │   └── config/            # Configuration
│   └── dist/                  # Production build
└── README.md                  # This file
```

## 🚀 Main Features

### 💰 Token System (ITCToken20)
- **Custom ERC-20 Token** with advanced features
- **Token purchase** with ETH
- **Token withdrawal** for ETH
- **Burn system** with complete tracking
- **Burn statistics** and history
- **Dynamic price management**

### 🏢 Company Management
- **Complete CRUD** for companies
- **Owner system** with transfer capability
- **Active/inactive states**
- **Advanced filtering and search**
- **Permission validation**

### 📦 Product Catalog
- **Complete product management**
- **Company association**
- **Real-time stock control**
- **Advanced filtering** by multiple criteria
- **Intelligent text search**
- **IPFS metadata** for images

### 🧾 Invoicing System
- **Invoice creation** by owners and clients
- **Invoice item management**
- **Token integration** for payments
- **Automatic stock updates**
- **Client purchase registration**
- **Complete transaction history**

### 👥 Client Management
- **Automatic client registration**
- **Purchase tracking** by company
- **Client statistics**
- **Active/inactive state management**
- **Invoice counters**

### 🎨 User Experience
- **Dynamic themes** based on role (Blue/Orange/Green)
- **Conditional navigation** based on connection status
- **Transaction optimization** (minimal confirmations)
- **Toast notifications** for feedback
- **Loading states** and error handling

### 🔐 Administration Panel
- **Complete dashboard** with statistics
- **CRUD management** of all entities
- **Advanced system statistics**
- **Invoice and transaction history**
- **Token and balance management**

## 🛠️ Development Strategies

### 🔒 Security
- **ReentrancyGuard** in critical operations
- **Comprehensive input validation**
- **Role-based access control**
- **Permission verification** between contracts
- **Integrated Safe Math** to prevent overflow

### ⚡ Gas Optimization
- **Batched transactions** to reduce costs
- **Single approval** of tokens for multiple operations
- **Efficient storage patterns**
- **Minimal external calls**
- **Packed structs** to save space

### 🎯 Optimized UX/UI
- **Code splitting** for better performance
- **Lazy loading** of components
- **Bundle optimization** with Vite
- **Tree shaking** of dependencies
- **Dynamic themes** for better experience

### 🧪 Comprehensive Testing
- **190+ tests** covering all contracts
- **Unit tests** for each function
- **Integration tests** between contracts
- **Fuzz tests** for robust validation
- **Edge case tests** and error handling

## 🚀 Installation and Setup

### Prerequisites
- **Node.js 18+**
- **Foundry** installed
- **MetaMask** in browser
- **Git** to clone repository

### Quick Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd codeEcommerce
```

2. **Setup the backend:**
```bash
cd backend
forge install
forge build
```

3. **Setup the frontend:**
```bash
cd ../frontend
npm install
```

4. **Start Anvil (in a separate terminal):**
```bash
anvil
```

5. **Deploy the contracts:**
```bash
cd backend
./deploy_contracts.sh
```

6. **Start the frontend:**
```bash
cd ../frontend
npm run dev
```

7. **Open [http://localhost:5173](http://localhost:5173)** in your browser

## 📖 Detailed Documentation

### Backend (Smart Contracts)
📚 **[View Backend README](./backend/README.md)**
- Contract architecture
- Detailed features
- Testing guides
- Deployment scripts
- Usage examples

### Frontend (Web Application)
📚 **[View Frontend README](./frontend/README.md)**
- Technology stack
- Component structure
- Custom hooks
- Performance optimizations
- Development guides

## 🎓 Implemented Blockchain Concepts

### 🔗 Smart Contracts
- **ERC-20 Token Standard** with custom extensions
- **Ownership Pattern** for access control
- **Factory Pattern** for entity creation
- **Event-Driven Architecture** for off-chain indexing

### 💡 Design Patterns
- **Repository Pattern** for data management
- **Service Layer** for business logic
- **Observer Pattern** with blockchain events
- **Strategy Pattern** for different user types

### 🔄 Transaction Flows
- **Multi-step Transactions** with validation
- **Batch Operations** for gas optimization
- **Comprehensive Error Handling**
- **Consistent State Management**

## 🧪 Testing and Quality

### Backend Testing
```bash
# Run all tests
forge test

# Tests with gas report
forge test --gas-report

# Tests with coverage
forge coverage
```

### Frontend Testing
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Production build
npm run build
```

## 🚀 Deployment

### Local Development
- **Anvil** for local network
- **MetaMask** configured for localhost
- **Hot reload** in development

### Production
- **Sepolia Testnet** for testing
- **Mainnet** for production
- **Contract verification** on Etherscan

## 📊 Project Metrics

### Smart Contracts
- **5 main contracts**
- **190+ tests** with 100% coverage
- **Gas optimization** implemented
- **Events** for off-chain indexing

### Frontend
- **15+ pages** and components
- **10+ custom hooks**
- **7 integration services**
- **Optimized bundle** < 1MB

### Features
- **Complete CRUD** for all entities
- **Role system** (Admin, Client, Not connected)
- **Dynamic themes** by user role
- **Transaction optimization** (2 confirmations maximum)

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if necessary
5. Run the test suite
6. Submit a Pull Request

### Code Standards
- **Solidity**: Follow OpenZeppelin best practices
- **TypeScript**: Strict typing and clear interfaces
- **React**: Functional components with hooks
- **Testing**: Complete feature coverage

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Help Resources
- **Repository issues** to report bugs
- **Detailed documentation** in each README
- **Code examples** in tests and components
- **Code comments** for explanations

### Contact
- Create an issue in the repository
- Review existing documentation
- Consult usage examples

## 🚀 Next Steps

### Completed Features ✅
- [x] Complete token system
- [x] Company and product management
- [x] Invoicing system
- [x] Administration panel
- [x] Dynamic themes
- [x] Transaction optimization
- [x] Token burn history
- [x] Comprehensive testing

### Future Roadmap 🎯
- [ ] **PWA (Progressive Web App)**
- [ ] **Offline mode** with synchronization
- [ ] **Internationalization (i18n)**
- [ ] **Advanced analytics** and metrics
- [ ] **Push notification system**
- [ ] **Integration with more wallets**
- [ ] **E2E tests** with Playwright
- [ ] **Automated CI/CD pipeline**
- [ ] **Interactive documentation**
- [ ] **Review and rating system**

## 🎓 Project Learnings

### Blockchain Development
- **Smart Contract Architecture** and best practices
- **Gas Optimization** and transaction efficiency
- **Security Patterns** and vulnerability prevention
- **Testing Strategies** for smart contracts

### Frontend Development
- **Web3 Integration** with ethers.js
- **State Management** in blockchain applications
- **UX Optimization** for transactions
- **Performance Optimization** with code splitting

### Full-Stack Integration
- **Efficient Contract-Frontend Communication**
- **Error Handling** in Web3 applications
- **User Experience** in decentralized applications
- **Development Workflow** for blockchain projects

---

**🎉 This project demonstrates a complete blockchain e-commerce ecosystem, from smart contracts to a modern and optimized user interface!**
