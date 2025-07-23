// src/pages/ProductDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';

// API function to fetch a single product by ID
const fetchProductById = async (productId) => {
    // Ensure productId is treated as a number for the database query
    const numericProductId = parseInt(productId, 10);
    if (isNaN(numericProductId)) {
        throw new Error("Invalid product ID.");
    }

    // --- THE FIX: Clean select statement without comments ---
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
        .eq('id', numericProductId)
        .single();

    if (error) {
        console.error("Error fetching product by ID:", error);
        throw new Error(`Product not found or database error: ${error.message}`);
    }
    return data;
};

const ProductDetailPage = () => {
    const { id } = useParams(); // Get the product ID from the URL parameter
    const { addToCart } = useCart();

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id], // Unique key for this specific product
        queryFn: () => fetchProductById(id),
        enabled: !!id, // Only run the query if an ID exists in the URL
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) { // Combined check for error or no product found
        return (
            <div className="p-8 text-center min-h-[calc(100vh-200px)]">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">
                    {error ? "Error Loading Product" : "Product Not Found"}
                </h1>
                <p className="text-red-500">{error ? error.message : "The product you are looking for does not exist."}</p>
                <Link to="/" className="text-blue-600 hover:underline mt-6 inline-block">← Return to Marketplace</Link>
            </div>
        );
    }

    const isAddableToCart = product.vendor?.stripe_account_id;

    return (
        <div className="bg-gray-100">
            <div className="container mx-auto p-4 md:p-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
                    {/* Product Image Section */}
                    <div className="md:w-1/2 p-6 flex items-center justify-center bg-gray-50">
                        <img 
                            src={product.image_url || 'https://via.placeholder.com/500x500'} 
                            alt={product.name} 
                            className="max-h-[500px] w-auto object-contain rounded-md"
                        />
                    </div>

                    {/* Product Details Section */}
                    <div className="md:w-1/2 p-8 flex flex-col">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
                        
                        <p className="text-sm text-gray-500 mb-4">
                            Sold by: {' '}
                            <span className="text-blue-600 font-medium">
                                {product.vendor?.business_name || 'Anonymous Vendor'}
                            </span>
                        </p>
                        
                        {/* Price */}
                        <p className="text-5xl font-extrabold text-gray-800 mb-6">${product.price.toFixed(2)}</p>

                        <p className="text-lg text-gray-700 mb-8 flex-grow whitespace-pre-line">{product.description}</p>
                        
                        {/* Add to Cart Button */}
                        <div className="mt-auto">
                            <div className="relative group">
                                <button 
                                    onClick={() => addToCart({ ...product, vendor_id: product.vendor_id })}
                                    disabled={!isAddableToCart}
                                    className="w-full py-3 px-6 bg-yellow-500 text-gray-900 font-bold text-xl rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center transition-colors"
                                >
                                    <FaShoppingCart className="mr-3" />
                                    {isAddableToCart ? 'Add to Cart' : 'Not Available'}
                                </button>
                                {/* Tooltip for disabled button */}
                                {!isAddableToCart && (
                                    <div className="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg whitespace-nowrap left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        This vendor is not accepting payments.
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;