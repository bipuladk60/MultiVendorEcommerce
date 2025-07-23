// src/pages/OrderSuccessPage.jsx
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const OrderSuccessPage = () => {
    return (
        <div className="container mx-auto p-8 text-center flex flex-col items-center min-h-[calc(100vh-200px)] justify-center">
            <FaCheckCircle className="text-green-500 text-7xl mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Thank You For Your Order!</h1>
            <p className="text-lg text-gray-600 mb-8">
                Your payment was successful and your order is being processed by the vendor.
            </p>
            <div className="flex space-x-4">
                <Link 
                    to="/" 
                    className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Continue Shopping
                </Link>
                <Link 
                    to="/profile" // Assuming the 'Orders' tab is on the profile page
                    className="py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors"
                >
                    View My Orders
                </Link>
            </div>
        </div>
    );
};

export default OrderSuccessPage;