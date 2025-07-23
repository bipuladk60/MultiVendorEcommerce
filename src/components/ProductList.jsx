// src/components/ProductList.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaBullhorn } from 'react-icons/fa';
import { supabase } from '../utils/supabaseClient';
import EditProductModal from './EditProductModal';

// API function to delete a product
const deleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};

// API function to toggle the promotion status of a product
const toggleProductPromotion = async ({ productId, currentStatus }) => {
    const { error } = await supabase
        .from('products')
        .update({ is_promoted: !currentStatus }) // Flips the boolean value
        .eq('id', productId);
    
    if (error) throw error;
};

const ProductList = ({ products, onProductUpdate }) => {
    const [editingProduct, setEditingProduct] = useState(null);
    const queryClient = useQueryClient();

    // Mutation for deleting a product
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            alert('Product deleted successfully!');
            onProductUpdate(); // Refetches the product list from the parent dashboard
        },
        onError: (error) => alert(`Error deleting product: ${error.message}`),
    });

    // Mutation for toggling the promotion status
    const promoteMutation = useMutation({
        mutationFn: toggleProductPromotion,
        onSuccess: (_, variables) => { // The second argument contains the variables passed to mutate
            // Invalidate the query to refetch the updated product list automatically
            queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
            alert(`Product is now ${!variables.currentStatus ? 'promoted' : 'no longer promoted'}.`);
        },
        onError: (error) => {
            alert(`Error updating promotion status: ${error.message}`);
        }
    });

    const handleDelete = (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(productId);
        }
    };

    const handleTogglePromotion = (productId, currentStatus) => {
        promoteMutation.mutate({ productId, currentStatus });
    };

    const handleEditClick = (product) => setEditingProduct(product);
    const handleCloseModal = () => setEditingProduct(null);

    if (!products || products.length === 0) {
        return <p className="text-gray-500">You have not added any products yet.</p>;
    }

    return (
        <>
            <div className="space-y-4">
                {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-4">
                            <img 
                                src={product.image_url || 'https://via.placeholder.com/64'} 
                                alt={product.name} 
                                className="w-16 h-16 object-cover rounded-md"
                            />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                                <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
                                {/* Promotion Status Indicator */}
                                {product.is_promoted && (
                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <FaBullhorn className="mr-1" /> Promoted
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Promotion Toggle Button */}
                            <button 
                                onClick={() => handleTogglePromotion(product.id, product.is_promoted)}
                                disabled={promoteMutation.isPending && promoteMutation.variables?.productId === product.id}
                                className={`p-2 rounded-full transition-colors ${
                                    product.is_promoted 
                                    ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                    : 'text-gray-500 bg-gray-200 hover:bg-gray-300'
                                }`}
                                title={product.is_promoted ? "Stop Promoting" : "Promote on Google Ads"}
                            >
                                <FaBullhorn size={18} />
                            </button>
                            <button 
                                onClick={() => handleEditClick(product)} 
                                className="p-2 text-blue-600 hover:text-blue-800" 
                                title="Edit Product"
                            >
                                <FaEdit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(product.id)} 
                                disabled={deleteMutation.isPending} 
                                className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400" 
                                title="Delete Product"
                            >
                                <FaTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <EditProductModal 
                product={editingProduct} 
                onClose={handleCloseModal} 
                onProductUpdate={onProductUpdate} 
            />
        </>
    );
};

export default ProductList;