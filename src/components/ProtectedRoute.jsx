// src/components/ProtectedRoute.jsx
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDeniedPage from '../pages/AccessDeniedPage';

// A simple loading spinner component to be consistent
const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-gray-100">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();

  // 1. First, respect the loading state from the AuthContext.
  //    Although App.jsx also has a loading guard, this makes the component
  //    self-contained and safe.
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. After loading is complete, check the user's role.
  //    We check for a logged-in 'user' first, then the 'profile.role'.
  //    The optional chaining `?.` is a final safety check.
  if (user && profile?.role === 'vendor') {
    // If they are a vendor, render the child route (e.g., VendorDashboardPage).
    return <Outlet />;
  }

  // 3. If they are not a vendor (or not logged in), show the Access Denied page.
  return <AccessDeniedPage />;
};

export default ProtectedRoute;