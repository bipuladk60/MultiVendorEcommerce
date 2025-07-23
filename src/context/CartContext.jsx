// src/context/CartContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // --- CHANGE #1: Initialize state from localStorage ---
    // We use a function inside useState to run this logic only once on initial load.
    const [cartItems, setCartItems] = useState(() => {
        try {
            // Try to get the saved cart from localStorage
            const localData = localStorage.getItem('cart');
            // If data exists, parse it from JSON. Otherwise, return an empty array.
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error parsing cart from localStorage", error);
            // If there's an error (e.g., corrupted data), start with an empty cart.
            return [];
        }
    });

    // --- CHANGE #2: Save to localStorage whenever the cart changes ---
    // This useEffect hook runs every time the `cartItems` state is updated.
    useEffect(() => {
        // Convert the cartItems array to a JSON string and save it.
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]); // The dependency array ensures this runs only when cartItems changes.


    // All the functions below remain the same. They modify the state,
    // which then triggers the useEffect hook to save the new state.

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const itemExists = prevItems.find(item => item.id === product.id);
            if (itemExists) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
        // We can remove the alert for a smoother UX or keep it if you like
        // alert(`${product.name} added to cart!`);
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };
    
    const updateQuantity = (productId, quantity) => {
        const numQuantity = parseInt(quantity, 10);
        if (numQuantity <= 0) {
            removeFromCart(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: numQuantity } : item
                )
            );
        }
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};