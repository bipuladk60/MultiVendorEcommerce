// src/components/VendorNavbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { FaSignOutAlt } from 'react-icons/fa';

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
                <nav className="flex items-center space-x-6 text-lg">
                    <Link to="/vendor/dashboard" className="font-semibold hover:text-indigo-400">Dashboard</Link>
                    {/* Add links to Analytics, Business Profile, History here later */}
                    <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-500" title="Logout">
                        <FaSignOutAlt size={22} />
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default VendorNavbar;