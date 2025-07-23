// src/pages/UserProfilePage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FaUser, FaBox } from 'react-icons/fa';

// API function to fetch user orders (this is correct)
const fetchUserOrders = async (userId) => {
  const { data, error } = await supabase.from('orders').select('*, order_items(*, products(*))').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const UserProfilePage = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);

  // Simplified formData state, now includes address
  const [formData, setFormData] = useState({
    username: '', 
    phone: '',
    address: '' 
  });

  // useEffect to sync state when profile data loads (this is correct and essential)
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Fetch orders query (this is correct)
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => fetchUserOrders(user.id),
    enabled: !!user?.id,
  });

  // Update profile mutation (this is correct)
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData) => {
      const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      alert("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setEditMode(false);
    },
    onError: (error) => alert(`Error updating profile: ${error.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const renderProfileSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Personal Information</h2>
        <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">{editMode ? 'Cancel' : 'Edit'}</button>
      </div>
      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={user?.email || ''} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-900"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/>
          </div>
          {/* --- NEWLY ADDED ADDRESS FIELD --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/>
          </div>
          <button type="submit" disabled={updateProfileMutation.isPending} className="w-full py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
        </form>
      ) : (
        <div className="space-y-4 text-sm">
          <div><span className="font-medium text-gray-700">Username:</span><p className="text-gray-900">{profile?.username || 'Not set'}</p></div>
          <div><span className="font-medium text-gray-700">Email:</span><p className="text-gray-900">{user?.email}</p></div>
          <div><span className="font-medium text-gray-700">Phone:</span><p className="text-gray-900">{profile?.phone || 'Not provided'}</p></div>
          <div><span className="font-medium text-gray-700">Shipping Address:</span><p className="text-gray-900 whitespace-pre-line">{profile?.address || 'Not provided'}</p></div>
        </div>
      )}
    </div>
  );

  const renderOrdersSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order History</h2>
      {ordersLoading ? <p>Loading orders...</p> : orders.length === 0 ? <p className="text-gray-500">You haven't placed any orders yet.</p> : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-medium">Order #{order.id}</p><p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p></div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span>
              </div>
              <div className="mt-4 border-t pt-4 space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img src={item.products.image_url} alt={item.products.name} className="w-16 h-16 object-cover rounded"/>
                    <div><p className="font-medium">{item.products.name}</p><p className="text-sm text-gray-500">Quantity: {item.quantity}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t"><p className="text-right font-medium">Total: ${parseFloat(order.total_price).toFixed(2)}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64">
            <div className="bg-white rounded-lg shadow">
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaUser className="mr-3"/>Profile</button>
                <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaBox className="mr-3"/>Orders</button>
              </nav>
            </div>
          </div>
          <div className="flex-1">
            {activeTab === 'profile' && renderProfileSection()}
            {activeTab === 'orders' && renderOrdersSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;