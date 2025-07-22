// src/pages/OrderSuccessPage.jsx
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const OrderSuccessPage = () => {
    return (
        <div className="container mx-auto p-8 text-center flex flex-col items-center min-h-[calc(100vh-100px)]">
            <FaCheckCircle className="text-green-500 text-6xl mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Thank You For Your Order!</h1>
            <p className="text-lg text-gray-600 mb-6">Your payment was successful and your order is being processed.</p>
            <Link to="/" className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                Continue Shopping
            </Link>
        </div>
    );
};
export default OrderSuccessPage;