// src/pages/HomePage.jsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';

// API function to fetch all products AND their vendor's info
const fetchAllProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            vendor:vendor_id (
                id,
                business_name,
                stripe_account_id
            )
        `)
        .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
};

const HomePage = () => {
    const { addToCart } = useCart();
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['allProductsWithVendorInfo'],
        queryFn: fetchAllProducts,
    });

    if (isLoading) return <div className="p-8 text-center text-xl text-gray-700">Loading products...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error fetching products: {error.message}</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Marketplace</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {(products || []).map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-shadow hover:shadow-xl">
                            {/* Product Image */}
                            <div className="h-48 overflow-hidden">
                                <img 
                                    src={product.image_url || 'https://via.placeholder.com/300'} 
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                            </div>
                            
                            {/* Product Details */}
                            <div className="p-4 flex-grow flex flex-col">
                                <h2 className="text-xl font-semibold text-gray-800 truncate" title={product.name}>
                                    {product.name}
                                </h2>
                                
                                {/* Vendor Name */}
                                <p className="text-sm text-gray-500 mt-1">
                                    Sold by: {' '}
                                    <span className="text-blue-600 font-medium">
                                        {product.vendor?.business_name || 'Anonymous Vendor'}
                                    </span>
                                </p>
                                
                                <p className="text-gray-600 mt-2 flex-grow line-clamp-2">{product.description}</p>
                                
                                {/* Price and Add to Cart Button */}
                                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                    <p className="text-2xl font-bold text-gray-800">${product.price}</p>
                                    
                                    {/* Tooltip Wrapper */}
                                    <div className="relative group"> 
                                        <button 
                                            onClick={() => addToCart(product)}
                                            disabled={!product.vendor?.stripe_account_id}
                                            className="py-2 px-4 bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            <FaShoppingCart />
                                        </button>
                                        
                                        {/* Tooltip */}
                                        {!product.vendor?.stripe_account_id && (
                                            <div 
                                                className="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg 
                                                        whitespace-nowrap right-0 
                                                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            >
                                                Not currently accepting payments!
                                                <div 
                                                    className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 
                                                            border-x-8 border-x-transparent border-t-8 border-t-gray-800"
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;