// src/pages/VendorDashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Import all necessary components
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';
import StripeOnboarding from '../components/StripeOnboarding';
// Note: You removed VendorProfileSettings, so I've removed the import and its usage.

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
    const navigate = useNavigate();

    const { data: products, isLoading, error, refetch } = useQuery({
        queryKey: ['vendorProducts', user?.id],
        queryFn: () => fetchVendorProducts(user.id),
        enabled: !!user,
    });

    // The corrected handleDeleteAccount function
    const handleDeleteAccount = async () => {
        const confirmationText = "DELETE";
        const promptResponse = prompt(`This action is permanent and cannot be undone. It will delete all your products and account data. To confirm, please type "${confirmationText}" below:`);

        if (promptResponse === confirmationText) {
            try {
                // --- THIS IS THE FIX ---
                // 1. Get the current user session to access the authentication token.
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) throw new Error("User not authenticated. Please log in again.");

                // 2. Invoke the 'delete-user' function, passing the user's token in the Authorization header.
                const { error: invokeError } = await supabase.functions.invoke('delete-user', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                
                if (invokeError) throw invokeError;
                // --- END OF FIX ---
                
                alert("Your account has been successfully deleted.");
                await supabase.auth.signOut(); // Log the user out from the client
                navigate('/'); // Redirect to the homepage
            } catch (error) {
                alert(`Error deleting account: ${error.message}`);
            }
        } else {
            alert("Account deletion cancelled.");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-xl text-gray-700">Loading Dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h1>

                {/* --- Onboarding Section --- */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-10">
                    <StripeOnboarding />
                </div>

                {/* --- Product Management Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Add Product Form */}
                    <div className="lg-col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add a New Product</h2>
                            <AddProductForm onProductAdded={refetch} />
                        </div>
                    </div>

                    {/* Column 2: Product List */}
                    <div className="lg-col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Products</h2>
                            <ProductList products={products} onProductUpdate={refetch} />
                        </div>
                    </div>
                </div>

                {/* --- Danger Zone Section --- */}
                <div className="mt-12">
                    <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
                        <p className="text-red-700 mt-2 mb-4">
                            Deleting your account is a permanent action and cannot be undone. 
                            This will delete all of your products and personal information.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            Delete My Account Permanently
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default VendorDashboardPage;