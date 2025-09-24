import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from './common/Header';
import Footer from './common/Footer';
import './index.css';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const Companies = lazy(() => import('./pages/Companies'));

// User pages - lazy loaded
const TokenPurchase = lazy(() => import('./pages/TokenPurchase'));
const WithdrawTokens = lazy(() => import('./pages/WithdrawTokens'));
const PurchaseHistory = lazy(() => import('./pages/PurchaseHistory'));
const MyBalance = lazy(() => import('./pages/MyBalance'));

// Admin pages - lazy loaded (less frequently used)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminStatistics = lazy(() => import('./pages/admin/AdminStatistics'));
const AdminBalance = lazy(() => import('./pages/admin/AdminBalance'));
const AdminSiteManagement = lazy(() => import('./pages/admin/AdminSiteManagement'));
const ClientManagement = lazy(() => import('./pages/admin/ClientManagement'));
const CreateCompany = lazy(() => import('./pages/admin/CreateCompany'));
const CreateProduct = lazy(() => import('./pages/admin/CreateProduct'));
const AdminInvoiceHistory = lazy(() => import('./pages/admin/AdminInvoiceHistory'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/tokens" element={<TokenPurchase />} />
              <Route path="/withdraw" element={<WithdrawTokens />} />
              <Route path="/my-balance" element={<MyBalance />} />
              
              {/* User Routes */}
              <Route path="/purchases" element={<PurchaseHistory />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/companies" element={<Companies />} />
              <Route path="/admin/companies/create" element={<CreateCompany />} />
              <Route path="/admin/products/create" element={<CreateProduct />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
            <Route path="/admin/balance" element={<AdminBalance />} />
            <Route path="/admin/site-management" element={<AdminSiteManagement />} />
            <Route path="/admin/clients" element={<ClientManagement />} />
            <Route path="/admin/invoices" element={<AdminInvoiceHistory />} />
            <Route path="/admin/products" element={<div className="p-8 text-center">📦 Product Management - Coming Soon</div>} />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/companies" element={<Companies />} />
              
              <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
            </Routes>
          </Suspense>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;