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
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tokens" element={<TokenPurchase />} />
            <Route path="/withdraw" element={<WithdrawTokens />} />
            <Route path="/purchases" element={<PurchaseHistory />} />
            <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;