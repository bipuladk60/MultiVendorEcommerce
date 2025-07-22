// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from './context/AuthContext';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import CartPage from './pages/CartPage';
import StripeReturnPage from './pages/StripeReturnPage';
import VendorDashboardPage from './pages/VendorDashboardPage';

// Import Pages and Components
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';

// Create a client instance for TanStack Query
const queryClient = new QueryClient();



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
      <Router>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/cart" element={<CartPage />} />
              {/* Stripe-specific routes */}
              <Route path="/stripe-return" element={<StripeReturnPage />} />
              {/* The refresh URL can just point back to the dashboard */}
              <Route path="/stripe-refresh" element={<VendorDashboardPage />} />

              {/* Protected Vendor Route */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<VendorDashboardPage />} />
              </Route>
              
              {/* ... catch-all route ... */}
            </Routes>
          </main>
        </AuthProvider>
      </Router>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;