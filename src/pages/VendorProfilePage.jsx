// src/pages/VendorProfilePage.jsx
import { useState, useEffect } from 'react'; // 1. Import useEffect
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FaStore, FaBox, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Added for navigation

// API functions (your versions were great, just small tweaks for clarity)
const fetchVendorOrders = async () => {
  const { data, error } = await supabase.rpc('get_vendor_orders');
  if (error) throw error;
  return data || [];
};

const calculateAnalytics = (orders) => {
  if (!orders || orders.length === 0) return { totalOrders: 0, totalRevenue: 0, completedOrders: 0, processingOrders: 0 };
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  return { totalOrders, totalRevenue, completedOrders, processingOrders };
};

const VendorProfilePage = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Added for navigation
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);

  // Initialize with an empty structure
  const [formData, setFormData] = useState({
    business_name: '', phone: '', address: '', tax_id: ''
  });

  // --- 2. THE FIX: Use useEffect to sync state when profile data loads ---
  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        tax_id: profile.tax_id || '',
      });
    }
  }, [profile]); // This dependency array tells React to run this code whenever `profile` changes

  // Update the query configuration
  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['vendorOrders', user?.id],
    queryFn: () => fetchVendorOrders(),
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['vendorAnalytics', user?.id],
    queryFn: () => calculateAnalytics(orders),
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile', user?.id]);
      queryClient.invalidateQueries(['vendorOrders', user?.id]);
      queryClient.invalidateQueries(['vendorAnalytics', user?.id]);
      setEditMode(false);
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorOrders', user?.id]);
      queryClient.invalidateQueries(['vendorAnalytics', user?.id]);
      refetchOrders();
      refetchAnalytics();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  // ... The rest of your render functions are great. I am pasting them here for completeness.

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Existing profile section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Business Information</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Address</label>
              <textarea
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.business_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Address</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.business_address || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <p className="mt-1 text-sm text-gray-900">{profile?.tax_id || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-lg font-medium text-red-800">Delete Account</h3>
            <p className="mt-1 text-sm text-red-600">
              Permanently delete your vendor account and all associated data. This action cannot be undone.
            </p>
            <div className="mt-4">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-lg font-medium text-red-800">Disconnect Stripe</h3>
            <p className="mt-1 text-sm text-red-600">
              Disconnect your Stripe account. This will prevent you from receiving payments until you reconnect.
            </p>
            <div className="mt-4">
              <button
                onClick={handleDisconnectStripe}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Disconnect Stripe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update the renderOrdersSection to include status update functionality
  const renderOrdersSection = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order Management</h2>
        {ordersLoading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders found</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => {
                      updateOrderStatusMutation.mutate({
                        orderId: order.id,
                        status: e.target.value,
                      });
                    }}
                    disabled={updateOrderStatusMutation.isPending}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="mt-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-2">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.product.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-right font-medium">
                    Total: ${order.total_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Business Analytics</h2>
      {analyticsLoading ? <p>Loading analytics...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg"><h3 className="text-lg font-medium text-blue-800">Total Orders</h3><p className="text-3xl font-bold text-blue-600 mt-2">{analytics?.totalOrders}</p></div>
          <div className="bg-green-50 p-6 rounded-lg"><h3 className="text-lg font-medium text-green-800">Total Revenue</h3><p className="text-3xl font-bold text-green-600 mt-2">${analytics?.totalRevenue.toFixed(2)}</p></div>
          <div className="bg-yellow-50 p-6 rounded-lg"><h3 className="text-lg font-medium text-yellow-800">Processing Orders</h3><p className="text-3xl font-bold text-yellow-600 mt-2">{analytics?.processingOrders}</p></div>
          <div className="bg-purple-50 p-6 rounded-lg"><h3 className="text-lg font-medium text-purple-800">Completed Orders</h3><p className="text-3xl font-bold text-purple-600 mt-2">{analytics?.completedOrders}</p></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64"><div className="bg-white rounded-lg shadow"><nav className="space-y-1">
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaStore className="mr-3"/>Business Profile</button>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaBox className="mr-3"/>Orders</button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaChartLine className="mr-3"/>Analytics</button>
          </nav></div></div>
          <div className="flex-1">
            {activeTab === 'profile' && renderProfileSection()}
            {activeTab === 'orders' && renderOrdersSection()}
            {activeTab === 'analytics' && renderAnalyticsSection()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default VendorProfilePage;

// Add the delete account handler
const handleDeleteAccount = async () => {
  const confirmationText = "DELETE";
  const promptResponse = prompt(`This action is permanent and cannot be undone. It will delete all your products and account data. To confirm, please type "${confirmationText}" below:`);

  if (promptResponse === confirmationText) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("User not authenticated. Please log in again.");

      const { error: invokeError } = await supabase.functions.invoke('delete-user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (invokeError) throw invokeError;
      
      alert("Your account has been successfully deleted.");
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      alert(`Error deleting account: ${error.message}`);
    }
  } else {
    alert("Account deletion cancelled.");
  }
};

// Add the disconnect Stripe handler
const handleDisconnectStripe = async () => {
  if (window.confirm('Are you sure you want to disconnect your Stripe account? You will not be able to receive payments until you reconnect.')) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          stripe_account_id: null,
          stripe_onboarding_completed: false
        })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries(['profile', user?.id]);
      alert('Stripe account disconnected successfully.');
    } catch (error) {
      alert(`Error disconnecting Stripe: ${error.message}`);
    }
  }
};