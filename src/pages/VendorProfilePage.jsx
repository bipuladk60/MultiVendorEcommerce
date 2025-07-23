// src/pages/VendorProfilePage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FaStore, FaBox, FaChartLine } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const fetchVendorOrders = async () => {
  const { data, error } = await supabase.rpc('get_vendor_orders');
  if (error) throw error;
  return data || [];
};

const calculateVendorAnalytics = (orders) => {
  if (!orders || orders.length === 0) {
    return { totalOrders: 0, totalRevenue: 0, completedOrders: 0, processingOrders: 0, dailySales: {}, weeklySales: {} };
  }
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const processingOrders = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
  const dailySales = {};
  const weeklySales = {};
  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const dateKey = orderDate.toISOString().split('T')[0];
    dailySales[dateKey] = (dailySales[dateKey] || 0) + parseFloat(order.total_price);
    const weekStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate() - orderDate.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklySales[weekKey] = (weeklySales[weekKey] || 0) + parseFloat(order.total_price);
  });
  return { totalOrders, totalRevenue, completedOrders, processingOrders, dailySales, weeklySales };
};

const VendorProfilePage = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ business_name: '', phone: '', address: '', tax_id: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        tax_id: profile.tax_id || '',
      });
    }
  }, [profile]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['vendorOrders', user?.id],
    queryFn: fetchVendorOrders,
    enabled: !!user?.id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['vendorAnalytics', orders],
    queryFn: () => calculateVendorAnalytics(orders),
    enabled: !ordersLoading,
  });

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
  
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vendorOrders', user?.id] });
    },
    onError: (error) => alert(`Error updating status: ${error.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderProfileSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Business Information</h2>
        <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">{editMode ? 'Cancel' : 'Edit'}</button>
      </div>
      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">Business Name</label><input type="text" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Business Address</label><textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Tax ID</label><input type="text" value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"/></div>
          <button type="submit" disabled={updateProfileMutation.isPending} className="w-full py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
        </form>
      ) : (
        <div className="space-y-4 text-sm">
          <div><span className="font-medium text-gray-700">Business Name:</span><p className="text-gray-900">{profile?.business_name || 'Not provided'}</p></div>
          <div><span className="font-medium text-gray-700">Contact Email:</span><p className="text-gray-900">{user?.email}</p></div>
          <div><span className="font-medium text-gray-700">Phone:</span><p className="text-gray-900">{profile?.phone || 'Not provided'}</p></div>
          <div><span className="font-medium text-gray-700">Address:</span><p className="text-gray-900 whitespace-pre-line">{profile?.address || 'Not provided'}</p></div>
          <div><span className="font-medium text-gray-700">Tax ID:</span><p className="text-gray-900">{profile?.tax_id || 'Not provided'}</p></div>
        </div>
      )}
    </div>
  );

  const renderOrdersSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order Management</h2>
      {ordersLoading ? <p>Loading orders...</p> : orders.length === 0 ? <p className="text-gray-500">No new orders found.</p> : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Order #{order.order_id}</p>
                  <p className="text-sm text-gray-500">Customer: {order.customer_username} ({order.customer_email})</p>
                  <p className="text-sm text-gray-500">Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <select value={order.status} onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.order_id, status: e.target.value })} disabled={updateOrderStatusMutation.isPending} className={`rounded-md border-gray-300 shadow-sm ${getStatusClasses(order.status)}`}>
                  <option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                </select>
              </div>
              <div className="mt-4 border-t pt-4">
                {order.order_items?.map((item, index) => (
                  <div key={item.id || index} className="flex items-center space-x-4 py-2">
                    <img src={item.product.image_url || 'https://via.placeholder.com/64'} alt={item.product.name} className="w-16 h-16 object-cover rounded"/>
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity} x ${item.price_at_purchase.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t"><p className="text-right font-medium">Order Total: ${parseFloat(order.total_price).toFixed(2)}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsSection = () => {
    const getChartData = (salesData, title) => {
      const labels = Object.keys(salesData).sort();
      const data = labels.map(label => salesData[label]);
      return { labels, datasets: [{ label: title, data, fill: false, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }] };
    };
    const chartOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Sales Over Time' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Revenue ($)' } }, x: { title: { display: true, text: 'Date' } } } };

    return (
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
        {!analyticsLoading && analytics?.totalOrders > 0 ? (
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Sales</h3>
                <div className="h-80 w-full"><Line data={getChartData(analytics.dailySales, 'Daily Revenue')} options={chartOptions} /></div>
                <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">Weekly Sales</h3>
                <div className="h-80 w-full"><Line data={getChartData(analytics.weeklySales, 'Weekly Revenue')} options={chartOptions} /></div>
            </div>
        ) : ( !analyticsLoading && <p className="mt-8 text-gray-500">No sales data to display for charts yet.</p> )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64">
            <div className="bg-white rounded-lg shadow">
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaStore className="mr-3"/>Business Profile</button>
                <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaBox className="mr-3"/>Orders</button>
                <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center px-4 py-3 text-sm font-medium ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><FaChartLine className="mr-3"/>Analytics</button>
              </nav>
            </div>
          </div>
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