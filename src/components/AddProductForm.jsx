// src/components/AddProductForm.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Zod schema for product validation (is_promoted removed)
const productSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters.'),
    description: z.string().optional(),
    price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive('Price must be a positive number.')),
    image: z.instanceof(File).refine(file => file.size > 0, 'Image is required.'),
});

const uploadImage = async (imageFile) => {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, imageFile);
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl;
};

const addProduct = async ({ productData, vendorId }) => {
    const imageUrl = await uploadImage(productData.image);
    // Destructure image and then prepare for DB
    const { image, ...restOfProductData } = productData; 
    const dbProductData = { 
        ...restOfProductData, 
        image_url: imageUrl, 
        vendor_id: vendorId,
        // is_promoted is no longer set here, it will default to FALSE in the DB
    };
    const { error } = await supabase.from('products').insert([dbProductData]);
    if (error) throw error;
};

const AddProductForm = ({ onProductAdded }) => {
    const { user } = useAuth();
    const [formError, setFormError] = useState(null);

    const mutation = useMutation({
        mutationFn: addProduct,
        onSuccess: () => {
            alert('Product added successfully!');
            onProductAdded();
            document.getElementById('add-product-form').reset(); // Reset form elements
        },
        onError: (error) => setFormError(error.message),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        const formData = new FormData(e.currentTarget);
        
        const fields = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: formData.get('price'),
            image: formData.get('image'),
            // is_promoted is removed from here
        };

        const result = productSchema.safeParse(fields);
        if (!result.success) {
            setFormError(result.error.issues[0].message);
            return;
        }
        mutation.mutate({ productData: result.data, vendorId: user.id });
    };

    return (
        <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4">
            {formError && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{formError}</div>)}
            <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label><input type="text" name="name" id="name" required className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"/></div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" id="description" rows="3" className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"></textarea></div>
            <div><label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label><input type="number" name="price" id="price" step="0.01" required className="mt-1 block w-full p-2 border rounded-md shadow-sm text-gray-900"/></div>
            
            <div><label htmlFor="image" className="block text-sm font-medium text-gray-700">Product Image</label><input type="file" name="image" id="image" required accept="image/png, image/jpeg, image/webp" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div>
            
            {/* --- "Promote" checkbox has been removed from this form --- */}

            <button type="submit" disabled={mutation.isPending} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300">
                {mutation.isPending ? 'Adding...' : 'Add Product'}
            </button>
        </form>
    );
};

export default AddProductForm;