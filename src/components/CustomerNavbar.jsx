// src/components/CustomerNavbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabaseClient';
import { FaShoppingCart, FaUser, FaSignOutAlt } from 'react-icons/fa';

const CustomerNavbar = () => {
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <header className="bg-gray-800 text-white shadow-md">
            <div className="container mx-auto flex justify-between items-center p-4">
                <Link to="/" className="text-2xl font-bold text-yellow-400">AmazonClone</Link>
                <nav className="flex items-center space-x-6">
                    <Link to="/profile" className="text-lg hover:text-yellow-400" title="My Profile">
                        <FaUser size={22} />
                    </Link>
                    <Link to="/cart" className="relative text-lg hover:text-yellow-400" title="Shopping Cart">
                        <FaShoppingCart size={24} />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-3 bg-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                    <button onClick={handleLogout} className="flex items-center text-lg text-red-400 hover:text-red-500" title="Logout">
                        <FaSignOutAlt size={22} />
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default CustomerNavbar;