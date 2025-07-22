// src/pages/VendorDashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

// Placeholder components we will create next
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';

// API function to fetch products for the logged-in vendor
const fetchVendorProducts = async (vendorId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

const VendorDashboardPage = () => {
    const { user } = useAuth();

    const { data: products, isLoading, error, refetch } = useQuery({
        queryKey: ['vendorProducts', user?.id],
        queryFn: () => fetchVendorProducts(user.id),
        enabled: !!user,
    });

    if (isLoading) return <div className="p-8 text-gray-800">Loading products...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Add Product Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add a New Product</h2>
                            <AddProductForm onProductAdded={refetch} />
                        </div>
                    </div>

                    {/* Column 2: Product List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Products</h2>
                            <ProductList products={products} onProductUpdate={refetch} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboardPage;
