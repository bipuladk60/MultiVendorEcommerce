// src/pages/CheckoutPage.jsx
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import CheckoutForm from '../components/CheckoutForm'; // We will create this next

// Load Stripe with your publishable key outside of the component to avoid re-loading
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
    const [clientSecret, setClientSecret] = useState('');
    const { cartItems } = useCart();
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    useEffect(() => {
        // Can only create a payment intent if there's a total price and items in the cart.
        if (totalPrice > 0 && cartItems.length > 0) {
            // Assumption: all items in cart are from the same vendor for this MVP.
            const vendorId = cartItems[0].vendor_id; 

            // Invoke the Edge Function to get the client secret
            supabase.functions.invoke('create-payment-intent', {
                body: { amount: totalPrice, vendor_id: vendorId }
            })
            .then(({ data, error }) => {
                if (error) {
                    console.error("Error invoking function:", error.message);
                    alert(`Error preparing payment: ${error.message}. The vendor may not have a Stripe account connected.`);
                }
                if (data?.clientSecret) {
                    setClientSecret(data.clientSecret);
                }
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
                <p>Add items to your cart to proceed to checkout.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>
            {clientSecret && (
                <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                </Elements>
            )}
            {!clientSecret && (
                <div className="text-center text-gray-600">Loading payment form...</div>
            )}
        </div>
    );
};

export default CheckoutPage;