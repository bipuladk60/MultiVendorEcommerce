// src/components/EditProductModal.jsx
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';

// Zod schema for product validation (is_promoted removed)
const updateProductSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters.'),
    description: z.string().optional(),
    price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive('Price must be a positive number.')),
});

const updateProduct = async ({ productId, updatedData }) => {
    const { error } = await supabase.from('products').update(updatedData).eq('id', productId);
    if (error) throw error;
};

const EditProductModal = ({ product, onClose, onProductUpdate }) => {
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState(null);

    // Sync formData with product prop when it changes
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0.0,
                // is_promoted is removed from here
            });
        }
    }, [product]);

    const mutation = useMutation({
        mutationFn: updateProduct,
        onSuccess: () => {
            alert('Product updated successfully!');
            onProductUpdate();
            onClose();
        },
        onError: (error) => setFormError(error.message),
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = name === 'price' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        const result = updateProductSchema.safeParse(formData);
        if (!result.success) {
            setFormError(result.error.issues[0].message);
            return;
        }
        mutation.mutate({ productId: product.id, updatedData: result.data });
    };

    if (!product || Object.keys(formData).length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Product</h2>
                {formError && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{formError}</div>)}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"/></div>
                    <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows="3" className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"></textarea></div>
                    <div><label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label><input type="number" name="price" value={formData.price || ''} onChange={handleChange} step="0.01" required className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"/></div>
                    
                    {/* --- "Promote" checkbox has been removed from this form --- */}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                            {mutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductModal;