// src/components/CheckoutForm.jsx
import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const { cartItems, clearCart } = useCart();
    const navigate = useNavigate();

    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- THIS IS THE FINAL PIECE: SAVING THE ORDER ---
    const saveOrder = async () => {
        const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        // 1. Create the main 'orders' record
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                total_price: totalPrice,
                status: 'Paid', // or 'Processing'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create the 'order_items' records for each item in the cart
        const orderItems = cartItems.map(item => ({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) throw itemsError;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        // This triggers the Stripe payment confirmation UI (e.g., 3D Secure)
        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/order-success`,
            },
            redirect: 'if_required', // Important: prevents immediate redirect
        });
        
        if (stripeError) {
            setMessage(stripeError.message);
            setIsProcessing(false);
            return;
        }

        try {
            // If payment is successful, save the order to our database
            await saveOrder();
            
            // Clear the cart and navigate to the success page
            clearCart();
            navigate('/order-success');
        } catch (dbError) {
            setMessage(`Payment succeeded, but failed to save order: ${dbError.message}`);
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <button 
                disabled={isProcessing || !stripe || !elements} 
                id="submit" 
                className="w-full mt-6 py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                <span id="button-text">
                    {isProcessing ? "Processing..." : "Pay now"}
                </span>
            </button>
            {message && <div id="payment-message" className="mt-4 text-center text-red-500">{message}</div>}
        </form>
    );
};

export default CheckoutForm;