// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Import Components
import ErrorBoundary from './components/ErrorBoundary';
import CustomerNavbar from './components/CustomerNavbar';
import VendorNavbar from './components/VendorNavbar';
import GuestNavbar from './components/GuestNavbar';
import ProtectedRoute from './components/ProtectedRoute'; // Your route guard

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorLoginPage from './pages/VendorLoginPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import VendorProfilePage from './pages/VendorProfilePage'; // New
import UserProfilePage from './pages/UserProfilePage';     // New
import CartPage from './pages/CartPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

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

// AppContent handles the core routing logic
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Routes WITHOUT the main layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vendor/login" element={<VendorLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      
      {/* Routes WITH the main layout */}
      <Route path="/" element={<MainLayout />}>
        {/* Public routes within the layout */}
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="profile" element={<UserProfilePage />} />

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

// Main App component
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