// src/components/VendorNavbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { FaSignOutAlt, FaStore, FaUser, FaChartLine } from 'react-icons/fa';

const VendorNavbar = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/vendor/login');
    };

    return (
        <header className="bg-gray-900 text-white shadow-md">
            <div className="container mx-auto flex justify-between items-center p-4">
                <Link to="/vendor/dashboard" className="text-2xl font-bold text-indigo-400">Vendor Portal</Link>
                <nav className="flex items-center space-x-6">
                    <Link 
                        to="/vendor/dashboard" 
                        className="flex items-center text-lg hover:text-indigo-400"
                        title="Dashboard"
                    >
                        <FaStore size={22} />
                    </Link>
                    <Link 
                        to="/vendor/profile" 
                        className="flex items-center text-lg hover:text-indigo-400"
                        title="Business Profile"
                    >
                        <FaUser size={22} />
                    </Link>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center text-lg text-red-400 hover:text-red-500" 
                        title="Logout"
                    >
                        <FaSignOutAlt size={22} />
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default VendorNavbar;