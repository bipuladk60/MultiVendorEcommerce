// src/components/ProductList.jsx
import { useState } from 'react'; // We need state to manage the modal
import { useMutation } from '@tanstack/react-query';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../utils/supabaseClient';
import EditProductModal from './EditProductModal'; // Import the modal

const deleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};

const ProductList = ({ products, onProductUpdate }) => {
    // State to manage which product is being edited and if the modal is open
    const [editingProduct, setEditingProduct] = useState(null);

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            alert('Product deleted successfully!');
            onProductUpdate();
        },
        onError: (error) => {
            alert(`Error deleting product: ${error.message}`);
        }
    });

    const handleDelete = (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(productId);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
    };
    
    const handleCloseModal = () => {
        setEditingProduct(null);
    };

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
                                <p className="text-sm text-gray-600">${product.price}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => handleEditClick(product)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit Product"
                            >
                                <FaEdit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(product.id)}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                                title="Delete Product"
                            >
                                <FaTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* The Modal is rendered here, but only visible when editingProduct is not null */}
            <EditProductModal 
                product={editingProduct} 
                onClose={handleCloseModal} 
                onProductUpdate={onProductUpdate} 
            />
        </>
    );
};

export default ProductList;