// src/pages/VendorDashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';
import StripeOnboarding from '../components/StripeOnboarding';

const VendorDashboardPage = () => {
  const { user } = useAuth();

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['vendorProducts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-8 text-center text-xl text-gray-700">Loading Dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h1>

        {/* Stripe Onboarding Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-10">
          <StripeOnboarding />
        </div>

        {/* Product Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add a New Product</h2>
              <AddProductForm onProductAdded={refetch} />
            </div>
          </div>

          {/* Product List */}
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