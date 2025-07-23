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

    // --- SAVING THE ORDER ---
    const saveOrder = async () => {
        try {
            const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
            
            console.log("Saving order with user ID:", user.id);
            console.log("Cart items:", cartItems);
            
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

            if (orderError) {
                console.error("Error creating order:", orderError);
                throw orderError;
            }

            console.log("Order created:", orderData);

            // 2. Create the 'order_items' records for each item in the cart
            const orderItems = cartItems.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price,
            }));

            console.log("Creating order items:", orderItems);

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) {
                console.error("Error creating order items:", itemsError);
                throw itemsError;
            }

            console.log("Order saved successfully");
            return orderData;
        } catch (error) {
            console.error("Error in saveOrder:", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!stripe || !elements) {
            setMessage("Stripe is not ready. Please try again.");
            return;
        }

        if (!user) {
            setMessage("You must be logged in to complete the purchase.");
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            console.log("Starting payment confirmation...");
            
            // This triggers the Stripe payment confirmation UI (e.g., 3D Secure)
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required', // Important: prevents immediate redirect
                confirmParams: {
                    return_url: `${window.location.origin}/order-success`,
                },
            });
            
            if (stripeError) {
                console.error("Stripe payment error:", stripeError);
                setMessage(stripeError.message);
                setIsProcessing(false);
                return;
            }

            // Check payment status
            if (paymentIntent && paymentIntent.status === 'succeeded') {
                console.log("Payment succeeded:", paymentIntent);
                
                try {
                    // If payment is successful, save the order to our database
                    await saveOrder();
                    
                    // Clear the cart and navigate to the success page
                    clearCart();
                    navigate('/order-success');
                } catch (dbError) {
                    console.error("Database error after successful payment:", dbError);
                    setMessage(`Payment succeeded, but failed to save order: ${dbError.message}. Please contact support with your payment confirmation.`);
                }
            } else {
                console.log("Payment not completed. Status:", paymentIntent?.status);
                setMessage("Payment was not completed. Please try again.");
            }
        } catch (error) {
            console.error("Unexpected error during payment:", error);
            setMessage("An unexpected error occurred. Please try again.");
        }

        setIsProcessing(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form id="payment-form" onSubmit={handleSubmit}>
                <div className="mb-6">
                    <PaymentElement 
                        id="payment-element" 
                        options={{
                            layout: "tabs"
                        }}
                    />
                </div>
                
                <button 
                    disabled={isProcessing || !stripe || !elements} 
                    id="submit" 
                    className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <span id="button-text">
                        {isProcessing ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            `Pay $${cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}`
                        )}
                    </span>
                </button>
                
                {message && (
                    <div id="payment-message" className={`mt-4 p-3 rounded ${
                        message.includes('succeeded') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default CheckoutForm;