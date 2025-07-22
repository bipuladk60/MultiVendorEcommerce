// src/components/AddProductForm.jsx
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // We need a UUID library

// Zod schema for product validation - image is now a file
const productSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters.'),
    description: z.string().optional(),
    price: z.preprocess(
        (a) => parseFloat(z.string().parse(a)),
        z.number().positive('Price must be a positive number.')
    ),
    // Zod validation for the image file
    image: z.instanceof(File).refine(file => file.size > 0, 'Image is required.')
             .refine(file => file.size < 4 * 1024 * 1024, 'Image must be less than 4MB.')
             .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Only .jpg, .png, and .webp formats are supported.'),
});

// --- NEW: API function for uploading the image ---
const uploadImage = async (imageFile) => {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`; // Create a unique file name
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

    if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    // Get the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
    
    return publicUrl;
};


// --- UPDATED: API function to add a product ---
const addProduct = async ({ productData, vendorId }) => {
    // 1. Upload the image first
    const imageUrl = await uploadImage(productData.image);

    // 2. Prepare product data for the database, excluding the raw file
    const dbProductData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image_url: imageUrl, // Use the URL from storage
        vendor_id: vendorId,
    };

    // 3. Insert into the database
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
            document.getElementById('add-product-form').reset();
        },
        onError: (error) => {
            setFormError(error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        const formData = new FormData(e.currentTarget);
        const fields = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: formData.get('price'),
            image: formData.get('image'), // Get the file object
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
            {/* ... error display div ... */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" name="name" id="name" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"></textarea>
            </div>
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input type="number" name="price" id="price" step="0.01" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            
            {/* --- UPDATED Image Input --- */}
            <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">Product Image</label>
                <input 
                    type="file" 
                    name="image" 
                    id="image" 
                    required
                    accept="image/png, image/jpeg, image/webp"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
            </div>
            
            <button type="submit" disabled={mutation.isPending} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
                {mutation.isPending ? 'Adding...' : 'Add Product'}
            </button>
        </form>
    );
};

export default AddProductForm;