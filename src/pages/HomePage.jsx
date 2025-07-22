// src/pages/HomePage.jsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';

// API function to fetch all products
const fetchAllProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
};

const HomePage = () => {
    const { addToCart } = useCart();
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['allProducts'],
        queryFn: fetchAllProducts,
    });

    if (isLoading) return <div className="p-8 text-center text-xl">Loading products...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Marketplace</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-shadow hover:shadow-xl">
                        <div className="h-48 overflow-hidden">
                            <img 
                                src={product.image_url || 'https://via.placeholder.com/300'} 
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                            <h2 className="text-xl font-semibold text-gray-800 truncate">{product.name}</h2>
                            <p className="text-gray-600 mt-2 flex-grow">{product.description}</p>
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-2xl font-bold text-blue-600">${product.price}</p>
                                <button 
                                    onClick={() => addToCart(product)}
                                    className="py-2 px-4 bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                >
                                    <FaShoppingCart />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;