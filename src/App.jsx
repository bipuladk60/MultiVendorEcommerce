// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom'; // Add useNavigate, useLocation
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useEffect } from 'react'; // Import useEffect for AppContent

// Import Components
import ErrorBoundary from './components/ErrorBoundary';
import CustomerNavbar from './components/CustomerNavbar';
import VendorNavbar from './components/VendorNavbar';
import GuestNavbar from './components/GuestNavbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorLoginPage from './pages/VendorLoginPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import VendorProfilePage from './pages/VendorProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import CartPage from './pages/CartPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import StripeReturnPage from './pages/StripeReturnPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

const queryClient = new QueryClient();

// NavbarController component
const NavbarController = () => {
  const { user, profile } = useAuth();
  if (profile?.role === 'vendor') return <VendorNavbar />;
  if (user) return <CustomerNavbar />;
  return <GuestNavbar />;
};

// MainLayout component with Outlet for nested routes
const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarController />
      <main className="flex-grow bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// AppContent handles the core routing logic and initial redirects
const AppContent = () => {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- THE FIX: Initial role-based redirect on app load ---
  useEffect(() => {
    // Only attempt redirect if:
    // 1. Auth loading is complete (`!loading`).
    // 2. A user is logged in (`user`).
    // 3. Their profile role is 'vendor' (`profile?.role === 'vendor'`).
    // 4. They are currently on the root path (`location.pathname === '/'`).
    if (!loading && user && profile?.role === 'vendor' && location.pathname === '/') {
      console.log("Redirecting vendor to dashboard from root URL.");
      navigate('/vendor/dashboard', { replace: true }); // 'replace' prevents adding to history
    }
  }, [loading, user, profile, location.pathname, navigate]); // Dependencies for this effect

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Routes WITHOUT the main layout (e.g., full-screen login pages) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vendor/login" element={<VendorLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/stripe-return" element={<StripeReturnPage />} />
      
      {/* Routes WITH the main layout */}
      <Route path="/" element={<MainLayout />}>
        {/* Public routes within the layout */}
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="profile" element={<UserProfilePage />} />

        {/* Checkout & Order Success (public-ish, but usually requires logged in user) */}
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-success" element={<OrderSuccessPage />} />

        {/* Protected Vendor routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="vendor/profile" element={<VendorProfilePage />} />
        </Route>
        
        {/* 404 Page */}
        <Route path="*" element={
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
          </div>
        }/>
      </Route>
    </Routes>
  );
};

// Main App component (no changes needed)
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </CartProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;