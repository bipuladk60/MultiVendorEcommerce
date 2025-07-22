// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';

// Import Navbars
import CustomerNavbar from './components/CustomerNavbar';
import VendorNavbar from './components/VendorNavbar';
import GuestNavbar from './components/GuestNavbar';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VendorLoginPage from './pages/VendorLoginPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import CartPage from './pages/CartPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// NavbarController component
const NavbarController = () => {
  const { user, profile } = useAuth();
  if (profile?.role === 'vendor') return <VendorNavbar />;
  if (user) return <CustomerNavbar />;
  return <GuestNavbar />;
};

// Layout component that includes the navbar
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarController />
      <main className="flex-grow bg-gray-100">
        {children}
      </main>
    </div>
  );
};

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-xl font-semibold text-gray-700 mb-4">Loading...</div>
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  </div>
);

// AppContent component to handle loading state
const AppContent = () => {
  const { loading, error } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full p-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vendor/login" element={<VendorLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Routes with layout */}
      <Route path="/" element={
        <Layout>
          <HomePage />
        </Layout>
      } />
      
      <Route path="/cart" element={
        <Layout>
          <CartPage />
        </Layout>
      } />

      {/* Protected vendor routes */}
      <Route path="/vendor/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <VendorDashboardPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* 404 route */}
      <Route path="*" element={
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center text-gray-800">404</h1>
            <p className="text-xl text-center text-gray-600 mt-4">Page not found</p>
          </div>
        </Layout>
      } />
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