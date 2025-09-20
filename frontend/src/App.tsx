import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './common/Header';
import Footer from './common/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TokenPurchase from './pages/TokenPurchase';
import WithdrawTokens from './pages/WithdrawTokens';
import PurchaseHistory from './pages/PurchaseHistory';
import Products from './pages/Products';
import Companies from './pages/Companies';
import MyBalance from './pages/MyBalance';
// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminBalance from './pages/admin/AdminBalance';
import AdminSiteManagement from './pages/admin/AdminSiteManagement';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-grow">
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
            <Route path="/admin/statistics" element={<AdminStatistics />} />
            <Route path="/admin/balance" element={<AdminBalance />} />
            <Route path="/admin/site-management" element={<AdminSiteManagement />} />
            <Route path="/admin/users" element={<div className="p-8 text-center">👥 User Management - Coming Soon</div>} />
            <Route path="/admin/products" element={<div className="p-8 text-center">📦 Product Management - Coming Soon</div>} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/companies" element={<Companies />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;