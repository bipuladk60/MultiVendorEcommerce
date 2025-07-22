// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import VendorDashboardPage from './pages/VendorDashboardPage';

// Import Pages and Components
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';

// Create a client instance for TanStack Query
const queryClient = new QueryClient();

const HomePage = () => (
    <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-800">Welcome to the Marketplace!</h1>
        <p className="mt-4 text-lg text-gray-600">Products will be displayed here soon.</p>
    </div>
);


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Vendor Route */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<VendorDashboardPage />} />
              </Route>
              
              {/* ... catch-all route ... */}
            </Routes>
          </main>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;