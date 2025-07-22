// src/pages/AccessDeniedPage.jsx
import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';

const AccessDeniedPage = () => {
    return (
        <div className="container mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
            <FaLock className="text-red-500 text-6xl mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-lg text-gray-600 mb-6">
                This page is restricted to Vendor accounts only.
            </p>
            <p className="text-gray-600">
                If you are a vendor, please log out and sign in with your vendor account.
            </p>
            <Link 
                to="/" 
                className="mt-8 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                Return to Homepage
            </Link>
        </div>
    );
};

export default AccessDeniedPage;