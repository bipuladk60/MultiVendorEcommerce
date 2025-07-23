// src/components/ProductList.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { FaEdit, FaTrash } from 'react-icons/fa';

const ProductList = ({ products, onProductUpdate }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  // Remove stock from initial state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  });

  const updateProductMutation = useMutation({
    mutationFn: async (updatedProduct) => {
      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', editingProduct.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setEditingProduct(null);
      onProductUpdate();
    },
    onError: (error) => {
      alert(`Error updating product: ${error.message}`);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      onProductUpdate();
    },
    onError: (error) => {
      alert(`Error deleting product: ${error.message}`);
    }
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      image_url: product.image_url || ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedProduct = {
      name: editForm.name,
      description: editForm.description,
      price: parseFloat(editForm.price),
      image_url: editForm.image_url
    };
    updateProductMutation.mutate(updatedProduct);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!products?.length) {
    return <p className="text-gray-500">No products found.</p>;
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-4">
          {editingProduct?.id === product.id ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    value={editForm.image_url}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Image Preview</label>
                  <img
                    src={editForm.image_url}
                    alt="Product preview"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{product.description}</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={deleteProductMutation.isPending}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-32 w-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductList;