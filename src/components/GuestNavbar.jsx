// src/components/GuestNavbar.jsx
import { Link } from 'react-router-dom';

const GuestNavbar = () => {
  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="text-2xl font-bold text-yellow-400">AmazonClone</Link>
        <nav className="flex items-center space-x-4">
          <Link to="/vendor/login" className="text-lg hover:text-yellow-400">Sell on AmazonClone</Link>
          <Link to="/login" className="px-4 py-2 text-lg font-semibold rounded-md bg-blue-600 hover:bg-blue-700">Login</Link>
          <Link to="/signup" className="px-4 py-2 text-lg font-semibold rounded-md bg-gray-700 hover:bg-gray-600">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
};

export default GuestNavbar;