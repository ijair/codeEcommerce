# E-commerce Frontend - React + TypeScript + Vite

Modern and optimized frontend for the e-commerce platform built with React, TypeScript, Vite, and Tailwind CSS. Includes complete integration with smart contracts, advanced state management, and an optimized user experience.

## 🏗️ Architecture

### Technology Stack

- **React 18** - Modern UI library with hooks
- **TypeScript** - Static typing for greater robustness
- **Vite** - Ultra-fast build tool with HMR
- **Tailwind CSS** - Utility-first CSS framework
- **Ethers.js** - Ethereum blockchain interaction
- **React Router** - SPA navigation
- **Zustand** - Lightweight and efficient state management

### Directory Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── ProductCard.tsx
│   │   ├── ShoppingCart.tsx
│   │   ├── Header.tsx
│   │   ├── Toast.tsx
│   │   └── ToastContainer.tsx
│   ├── pages/             # Application pages
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── MyBalance.tsx
│   │   ├── WithdrawTokens.tsx
│   │   ├── PurchaseHistory.tsx
│   │   ├── Invoice.tsx
│   │   └── admin/         # Administration pages
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminProducts.tsx
│   │       ├── AdminCompanies.tsx
│   │       ├── AdminClients.tsx
│   │       ├── AdminBalance.tsx
│   │       ├── AdminStatistics.tsx
│   │       └── AdminInvoiceHistory.tsx
│   ├── hooks/             # Custom hooks
│   │   ├── useWallet.ts
│   │   ├── useTokens.ts
│   │   ├── useAdmin.ts
│   │   ├── useCart.ts
│   │   ├── useCheckout.ts
│   │   ├── useProducts.ts
│   │   ├── useToast.ts
│   │   └── useTheme.ts
│   ├── services/          # Integration services
│   │   ├── contractService.ts
│   │   ├── tokenService.ts
│   │   ├── productService.ts
│   │   ├── companyService.ts
│   │   ├── clientService.ts
│   │   ├── checkoutService.ts
│   │   ├── adminStatsService.ts
│   │   └── burnHistoryService.ts
│   ├── types/             # Type definitions
│   │   └── contracts.ts
│   ├── config/            # Configuration
│   │   └── contracts.ts
│   ├── common/            # Common components
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── utils/             # Utilities
├── public/                # Static files
├── dist/                  # Production build
└── package.json
```

## 🚀 Features

### 🛍️ E-commerce Core
- ✅ **Product catalog** with advanced filtering
- ✅ **Persistent shopping cart**
- ✅ **Optimized checkout process**
- ✅ **Complete invoicing system**
- ✅ **Purchase history** for clients
- ✅ **Real-time stock management**

### 👤 User Management
- ✅ **Wallet connection** (MetaMask)
- ✅ **User roles** (Admin, Client, Not connected)
- ✅ **Dynamic themes** based on user role
- ✅ **Conditional navigation** based on connection status
- ✅ **Token and ETH balance management**

### 🔐 Administration Panel
- ✅ **Administrative dashboard** with statistics
- ✅ **Company management** (complete CRUD)
- ✅ **Product management** (complete CRUD)
- ✅ **Client management** (activate/deactivate)
- ✅ **Complete invoice history**
- ✅ **Advanced system statistics**
- ✅ **Token and balance management**

### 🎨 User Experience
- ✅ **Dynamic themes** (Blue, Orange, Green)
- ✅ **Responsive and optimized navigation**
- ✅ **Toast notifications** for feedback
- ✅ **Loading states** and error handling
- ✅ **MetaMask confirmation optimization**
- ✅ **Advanced search and filtering**

### 🔥 Advanced Features
- ✅ **Token burn system** with history
- ✅ **Burned token statistics**
- ✅ **Gas and transaction optimization**
- ✅ **Code splitting** for better performance
- ✅ **Lazy loading** of components

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask installed in browser
- Anvil running locally (for development)

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp env.example .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🏗️ Available Scripts

```bash
# Development
npm run dev          # Development server with HMR

# Build
npm run build        # Optimized production build
npm run preview      # Preview production build

# Linting and Formatting
npm run lint         # Run ESLint
npm run lint:fix     # Automatically fix linting errors

# Type Checking
npm run type-check   # Verify TypeScript types
```

## 🎨 Theme System

### Dynamic Themes by Role
- **🔵 Blue (Default)**: Not connected user
- **🟠 Orange (Admin)**: Connected admin user
- **🟢 Green (Client)**: Connected client user

### Implementation
```typescript
// Custom hook for themes
const { theme, getThemeClasses } = useTheme();

// Apply dynamic classes
<button className={getThemeClasses('bg-primary text-white')}>
  Button with dynamic theme
</button>
```

## 🔗 Blockchain Integration

### Contract Services
- **contractService.ts**: Contract instances and ABIs
- **tokenService.ts**: ITC token operations
- **productService.ts**: Product management
- **companyService.ts**: Company management
- **clientService.ts**: Client management
- **checkoutService.ts**: Optimized checkout process
- **burnHistoryService.ts**: Burned token history

### Custom Hooks
```typescript
// Wallet connection
const { isConnected, address, connect, disconnect } = useWallet();

// Token management
const { balance, buyTokens, burnTokens } = useTokens();

// Shopping cart
const { items, addItem, removeItem, clearCart } = useCart();

// Checkout process
const { processCheckout, isLoading } = useCheckout();

// Product management
const { products, loading, refreshProducts } = useProducts();
```

## 🚀 Performance Optimizations

### Code Splitting
- **Lazy loading** of administrative pages
- **Optimized chunks** by functionality
- **Tree shaking** of dependencies

### Bundle Optimization
```typescript
// Optimized Vite configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ethers-vendor': ['ethers'],
          'admin-pages': ['./src/pages/admin'],
          'user-pages': ['./src/pages'],
          'services': ['./src/services']
        }
      }
    },
    minify: 'esbuild',
    target: 'esnext'
  }
});
```

### Transaction Optimization
- **Single approval** of tokens for multiple purchases
- **Batched transactions** by company
- **Optimized gas estimation**

## 🎯 User Flow

### Not Connected User
1. **Limited navigation**: Only Home and Products
2. **Free exploration**: Can view products without connection
3. **Connection prompt**: When trying to add to cart

### Client User
1. **Wallet connection**: MetaMask integration
2. **Complete navigation**: Access to all functions
3. **Green theme**: Visual role indicator
4. **Optimized purchase**: Maximum 2 confirmations

### Administrator User
1. **Administrative panel**: Complete system access
2. **Orange theme**: Visual role indicator
3. **Complete management**: CRUD of companies, products, clients
4. **Advanced statistics**: Dashboard with metrics

## 🔧 Advanced Configuration

### Environment Variables
```bash
# .env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESSES='{"ITCToken20":"0x...","Company":"0x..."}'
```

### Contract Configuration
```typescript
// src/config/contracts.ts
export const CONTRACT_ADDRESSES = {
  local: {
    ITCToken20: '0x...',
    Company: '0x...',
    Products: '0x...',
    Invoice: '0x...',
    Clients: '0x...'
  }
};
```

## 🧪 Testing and Quality

### Quality Tools
- **ESLint**: Code linting
- **TypeScript**: Type verification
- **Vite**: Optimized build
- **Tailwind CSS**: Utility classes

### Best Practices
- **Functional components** with hooks
- **Strict typing** with TypeScript
- **Separation of concerns** in services
- **Comprehensive error handling**
- **Loading states** for better UX

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Build Optimizations
- **Minification** with esbuild
- **Automatic code splitting**
- **Tree shaking** of dependencies
- **Gzip compression** enabled
- **Optimized assets**

### Build Structure
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── react-vendor-[hash].js
│   ├── ethers-vendor-[hash].js
│   ├── admin-pages-[hash].js
│   └── index-[hash].css
└── vite.svg
```

## 🔍 Debugging and Development

### Development Tools
- **React DevTools**: Component inspection
- **MetaMask DevTools**: Transaction debugging
- **Vite HMR**: Hot Module Replacement
- **TypeScript**: IntelliSense and error checking

### Logs and Monitoring
```typescript
// Structured logging
console.log('🛒 Adding item to cart:', { productId, quantity });
console.log('✅ Transaction completed:', { hash, receipt });
console.log('❌ Transaction failed:', { error, reason });
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests: `npm run lint && npm run type-check`
5. Commit your changes: `git commit -m 'feat: add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Review the hooks documentation
- Consult examples in components
- Review contract configuration

## 🚀 Next Steps

- [x] Dynamic theme system
- [x] Transaction optimization
- [x] Complete administrative panel
- [x] Notification system
- [x] Burned token history
- [ ] Unit tests with Jest/Vitest
- [ ] PWA (Progressive Web App)
- [ ] Offline mode
- [ ] Internationalization (i18n)
- [ ] User analytics and metrics
- [ ] Push notification system
- [ ] Integration with more wallets
