// src/pages/HomePage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Import Link

// API function to fetch all products AND their vendor's info
const fetchAllProducts = async () => {
    // This is the clean, working select statement without comments
    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            description,
            price,
            image_url,
            vendor_id,
            vendor:profiles!products_vendor_id_fkey(
                id,
                business_name,
                stripe_account_id
            )
        `)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
    return data;
};

const HomePage = () => {
    const { addToCart } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['allProductsWithVendorInfo'],
        queryFn: fetchAllProducts,
    });

    // Filter products based on search term
    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    if (isLoading) return <div className="p-8 text-center text-xl text-gray-700">Loading products...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error fetching products: {error.message}</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Marketplace</h1>
                
                {/* Search Bar */}
                <div className="mb-8 flex justify-center">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.length === 0 && !isLoading && !error ? (
                        <p className="col-span-full text-center text-gray-500">No products found matching your search.</p>
                    ) : (
                        filteredProducts.map(product => (
                            // --- Wrap the entire card in a Link component ---
                            <Link key={product.id} to={`/products/${product.id}`} className="block">
                                <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-shadow hover:shadow-xl h-full">
                                    <div className="h-48 overflow-hidden">
                                        <img 
                                            src={product.image_url || 'https://via.placeholder.com/300'} 
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                    
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h2 className="text-xl font-semibold text-gray-800 truncate" title={product.name}>
                                            {product.name}
                                        </h2>
                                        
                                        <p className="text-sm text-gray-500 mt-1">
                                            Sold by: {' '}
                                            <span className="text-blue-600 font-medium">
                                                {product.vendor?.business_name || 'Anonymous Vendor'}
                                            </span>
                                        </p>
                                        
                                        <p className="text-gray-600 mt-2 flex-grow line-clamp-2">{product.description}</p>
                                        
                                        <div className="flex justify-between items-center mt-auto pt-4 border-t">
                                            <p className="text-2xl font-bold text-gray-800">${product.price.toFixed(2)}</p>
                                            
                                            <div className="relative group"> 
                                                <button 
                                                    // Prevent the Link from firing when the button is clicked
                                                    onClick={(e) => { 
                                                        e.preventDefault(); 
                                                        e.stopPropagation(); 
                                                        addToCart({ ...product, vendor_id: product.vendor_id });
                                                    }} 
                                                    disabled={!product.vendor?.stripe_account_id}
                                                    className="py-2 px-4 bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                                                >
                                                    <FaShoppingCart />
                                                </button>
                                                
                                                <div 
                                                    className="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg 
                                                            whitespace-nowrap right-0 
                                                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                >
                                                    {!product.vendor?.stripe_account_id && "Not accepting payments"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;