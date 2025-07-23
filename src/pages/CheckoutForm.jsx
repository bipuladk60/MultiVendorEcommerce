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

    // --- Function to Save Order to Supabase ---
    const saveOrder = async () => {
        try {
            if (!user) throw new Error("User not authenticated for order saving.");
            if (cartItems.length === 0) throw new Error("No items in cart to save order.");

            const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
            
            console.log("Attempting to save order with user ID:", user.id);
            console.log("Cart items for order:", cartItems);
            
            // 1. Create the main 'orders' record
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_price: totalPrice,
                    status: 'Paid', // Set status to 'Paid' upon successful Stripe confirmation
                })
                .select() // Use .select() to retrieve the inserted data, including the ID
                .single(); // Expect only one row returned

            if (orderError) {
                console.error("Error creating order in DB:", orderError);
                throw orderError;
            }
            if (!orderData) { // Defensive check
                throw new Error("Order data not returned after database insertion.");
            }

            console.log("Main order record created:", orderData);

            // 2. Prepare the 'order_items' records
            const orderItems = cartItems.map(item => ({
                order_id: orderData.id, // Link to the newly created order
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price, // Record price at time of purchase
            }));

            console.log("Preparing to insert order items:", orderItems);

            // 3. Insert all the order items
            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) {
                console.error("Error creating order items in DB:", itemsError);
                // In a production app, you might want to try to roll back the main order here.
                throw itemsError;
            }

            console.log("Order and order items saved successfully to Supabase.");
            return orderData; // Return the successful order data
        } catch (error) {
            console.error("Critical error in saveOrder function:", error);
            throw error; // Re-throw to be caught by the handleSubmit's try/catch
        }
    };

    // --- Handles the Payment Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic readiness checks
        if (!stripe || !elements) {
            setMessage("Stripe is not ready. Please try again.");
            return;
        }
        if (!user) {
            setMessage("You must be logged in to complete the purchase.");
            return;
        }
        if (cartItems.length === 0) {
            setMessage("Your cart is empty. Please add items to checkout.");
            return;
        }

        setIsProcessing(true);
        setMessage(null); // Clear previous messages

        try {
            console.log("Initiating payment confirmation with Stripe...");
            
            // 1. Confirm the payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements, // Pass the PaymentElement instance
                redirect: 'if_required', // Handle redirects for 3D Secure, etc.
                confirmParams: {
                    // This URL is where Stripe will redirect the user AFTER payment if needed.
                    return_url: `${window.location.origin}/order-success`, 
                },
            });
            
            // 2. Handle Stripe's response
            if (stripeError) {
                // Payment failed or required action could not be completed on client-side
                console.error("Stripe confirmPayment error:", stripeError);
                setMessage(stripeError.message);
                setIsProcessing(false);
                return; // Stop processing due to error
            }

            // If we reach here, it means the payment was initiated without client-side errors,
            // and Stripe will either redirect (if required) or provide paymentIntent status.
            if (paymentIntent && paymentIntent.status === 'succeeded') {
                console.log("Payment succeeded through Stripe:", paymentIntent);
                
                try {
                    // Save the order to our database only after Stripe confirms success
                    await saveOrder();
                    
                    // Clear the local cart state and local storage
                    clearCart();
                    
                    // Navigate to the success page
                    navigate('/order-success');
                } catch (dbError) {
                    console.error("Database error after successful Stripe payment:", dbError);
                    setMessage(`Payment succeeded, but failed to save order: ${dbError.message}. Please contact support with payment intent ID: ${paymentIntent.id}`);
                }
            } else if (paymentIntent) {
                // Payment not succeeded, but no direct error thrown (e.g., requires_action)
                console.log("Payment not completed. Status:", paymentIntent.status, "Payment Intent:", paymentIntent);
                setMessage(`Payment status: ${paymentIntent.status}. Please check your order history or try again.`);
            } else {
                // Unexpected scenario where paymentIntent is null but no error was thrown
                console.error("Unexpected outcome: confirmPayment returned no error and no paymentIntent.");
                setMessage("Payment process failed unexpectedly. Please try again.");
            }
        } catch (error) {
            // Catch any unexpected runtime errors
            console.error("An unexpected error occurred during payment submission:", error);
            setMessage("An unexpected error occurred. Please try again.");
        } finally {
            setIsProcessing(false); // Ensure processing state is reset
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form id="payment-form" onSubmit={handleSubmit}>
                <div className="mb-6">
                    <PaymentElement 
                        id="payment-element" 
                        options={{ layout: "tabs" }} // Visual preference for card input
                    />
                </div>
                
                <button 
                    type="submit"
                    disabled={isProcessing || !stripe || !elements} 
                    id="submit" 
                    className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <span id="button-text" className="flex items-center justify-center">
                        {isProcessing ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            `Pay $${cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}`
                        )}
                    </span>
                </button>
                
                {message && (
                    <div id="payment-message" className={`mt-4 p-3 rounded text-center ${
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