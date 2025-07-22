// src/pages/CartPage.jsx
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity } = useCart();

    // Calculate the total price of items in the cart
    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

    // Handle quantity changes from the input field
    const handleQuantityChange = (productId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        if (!isNaN(quantity)) {
            updateQuantity(productId, quantity);
        }
    };

    // If the cart is empty, show a message and a link to the marketplace
    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
                <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link 
                    to="/" 
                    className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Your Shopping Cart</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex items-center bg-white p-4 rounded-lg shadow-md">
                            <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                            <div className="flex-grow ml-4">
                                <h2 className="text-lg font-semibold text-gray-800">{item.name}</h2>
                                <p className="text-gray-600">${item.price}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                    className="w-16 p-2 border border-gray-300 rounded-md text-center text-gray-900"
                                />
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                                    <FaTrash size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-4">Order Summary</h2>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-800 font-semibold">${totalPrice}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-600">Shipping</span>
                            <span className="text-gray-800 font-semibold">Free</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl border-t pt-4">
                            <span>Total</span>
                            <span>${totalPrice}</span>
                        </div>
                        <Link to="/checkout">
                            <button className="mt-6 w-full py-3 px-6 bg-yellow-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">
                                Proceed to Checkout
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;