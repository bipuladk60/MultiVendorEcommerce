// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FaShoppingCart, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const { user, session } = useAuth(); // Get user and session from our context
    const { cartItems } = useCart();
    const navigate = useNavigate();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            // Navigate to the login page after successful logout
            navigate('/login');
        }
    };

    return (
        <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center p-4">
                {/* Brand/Logo */}
                <Link to="/" className="text-2xl font-bold text-yellow-400 hover:text-yellow-500 transition-colors">
                    AmazonClone
                </Link>

                {/* Navigation Links */}
                <nav className="flex items-center space-x-6">
                    {session ? (
                        // --- Links for Logged-In Users ---
                        <>
                            <Link to="/dashboard" className="text-lg hover:text-yellow-400 transition-colors">
                                Vendor Dashboard
                            </Link>
                            <Link to="/cart" className="relative text-lg hover:text-yellow-400 transition-colors">
                                <FaShoppingCart size={24} />
                                {totalItems > 0 && ( // Only show the badge if there are items
                                    <span className="absolute -top-2 -right-3 bg-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-lg text-red-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <FaSignOutAlt size={22} />
                            </button>
                        </>
                    ) : (
                        // --- Links for Guests ---
                        <>
                            <Link
                                to="/login"
                                className="px-4 py-2 text-lg font-semibold rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 text-lg font-semibold rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Navbar;