// src/pages/CheckoutPage.jsx
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'; // Added PaymentElement, etc.
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Added useAuth
import CheckoutForm from './CheckoutForm'; // Corrected import path

// Load Stripe with your publishable key outside of the component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { cartItems } = useCart();
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    useEffect(() => {
        if (totalPrice > 0 && cartItems.length > 0) {
            setLoading(true);
            setError(null);
            
            // This is now guaranteed to have vendor_id due to HomePage fix
            const vendorId = cartItems[0].vendor_id; 
            
            console.log("Cart items for payment intent:", cartItems);
            console.log("Attempting to create payment for vendor ID:", vendorId);
            console.log("Total price:", totalPrice);

            if (!vendorId) {
                setError("Cart items are missing vendor information. Please remove and re-add items, then try again.");
                setLoading(false);
                return;
            }

            supabase.functions.invoke('create-payment-intent', {
                body: { amount: totalPrice, vendor_id: vendorId }
            })
            .then(response => {
                setLoading(false);
                const { data, error: invokeError } = response;
                
                if (invokeError) {
                    console.error("Error invoking function:", invokeError);
                    setError(`Error preparing payment: ${invokeError.message || 'Unknown error'}.`);
                    return;
                }
                
                if (data?.error) {
                    console.error("Function returned error:", data.error);
                    setError(`Payment preparation failed: ${data.error}`);
                    return;
                }
                
                if (data?.clientSecret) {
                    console.log("Client secret received successfully");
                    setClientSecret(data.clientSecret);
                } else {
                    console.error("No client secret in response:", data);
                    setError("Failed to initialize payment. Please try again.");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Unexpected error in checkout useEffect:", err);
                setError("An unexpected error occurred. Please try again.");
            });
        }
    }, [totalPrice, cartItems]);
    
    const appearance = {
        theme: 'stripe',
    };
    const options = {
        clientSecret,
        appearance,
    };

    if (cartItems.length === 0) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-semibold">Your cart is empty.</h1>
                <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>
            
            {/* Order Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
                {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between py-2">
                        <span>{item.name} x {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${totalPrice}</span>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="ml-2 underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Payment Form */}
            {clientSecret && !error && (
                <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                </Elements>
            )}
            
            {/* Loading State */}
            {loading && !error && (
                <div className="text-center text-gray-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading payment form...
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;