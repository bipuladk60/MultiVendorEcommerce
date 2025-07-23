// src/pages/VendorProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { FaStore, FaBox, FaChartLine } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// API function to fetch vendor orders using our secure RPC call
const fetchVendorOrders = async () => {
  console.log("fetchVendorOrders (RPC): Attempting to fetch orders for current vendor...");
  const { data, error } = await supabase.rpc('get_vendor_orders');
  if (error) {
    console.error("fetchVendorOrders (RPC): API Error:", error);
    throw error;
  }
  console.log("fetchVendorOrders (RPC): Data received:", data); // Log the received data
  return data || [];
};

// API function to calculate analytics based on fetched orders
const calculateVendorAnalytics = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      recentSales: [],
      ordersByStatus: {}
    };
  }

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  // Get last 30 days of sales
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate basic metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;

  // Calculate orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate daily sales for the last 30 days
  const recentSales = [];
  let currentDate = new Date(thirtyDaysAgo);

  while (currentDate <= new Date()) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOrders = orders.filter(order => 
      order.created_at.split('T')[0] === dateStr
    );
    
    recentSales.push({
      date: dateStr,
      revenue: dayOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0),
      orders: dayOrders.length
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    recentSales,
    ordersByStatus
  };
};

const VendorProfilePage = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  
  // Add chart refs
  const revenueChartRef = useRef(null);
  const statusChartRef = useRef(null);

  const [formData, setFormData] = useState({
    business_name: '', phone: '', address: '', tax_id: ''
  });

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
            <div key={order.order_id} className="border rounded-lg p-4"> {/* Use order_id for key */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Order #{order.order_id}</p>
                  <p className="text-sm text-gray-500">Customer: {order.customer_username} ({order.customer_email})</p>
                  <p className="text-sm text-gray-500">Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <select 
                  value={order.status} 
                  onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.order_id, status: e.target.value })} 
                  disabled={updateOrderStatusMutation.isPending}
                  className={`rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${getStatusClasses(order.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mt-4 border-t pt-4">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, index) => (
                    // Use item.id as key for consistency if available, otherwise index is fine
                    <div key={item.id || index} className="flex items-center space-x-4 py-2">
                      <img src={item.product.image_url || 'https://via.placeholder.com/64'} alt={item.product.name} className="w-16 h-16 object-cover rounded"/>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity} x ${item.price_at_purchase.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No items found for this order.</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t"><p className="text-right font-medium">Order Total: ${parseFloat(order.total_price).toFixed(2)}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsSection = () => {
    if (analyticsLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Business Analytics</h2>
          <p>Loading analytics...</p>
        </div>
      );
    }

    // Prepare data for the revenue chart
    const revenueChartData = {
      labels: analytics.recentSales.map(sale => {
        const date = new Date(sale.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Daily Revenue',
          data: analytics.recentSales.map(sale => sale.revenue),
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Number of Orders',
          data: analytics.recentSales.map(sale => sale.orders),
          borderColor: 'rgb(16, 185, 129)', // green-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'ordersAxis'
        }
      ]
    };

    const revenueChartOptions = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Last 30 Days Performance'
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Revenue ($)'
          }
        },
        ordersAxis: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Number of Orders'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };

    // Prepare data for the status chart
    const statusChartData = {
      labels: Object.keys(analytics.ordersByStatus),
      datasets: [{
        data: Object.values(analytics.ordersByStatus),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(245, 158, 11, 0.8)', // yellow
          'rgba(239, 68, 68, 0.8)',  // red
          'rgba(107, 114, 128, 0.8)' // gray
        ]
      }]
    };

    const statusChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Orders by Status'
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Business Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.totalOrders}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${analytics.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.pendingOrders}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800">Completed Orders</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.completedOrders}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        {analytics.totalOrders > 0 && (
          <>
            {/* Revenue and Orders Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-[400px]">
                <Line
                  ref={revenueChartRef}
                  data={revenueChartData}
                  options={revenueChartOptions}
                  key="revenue-chart"
                />
              </div>
            </div>

            {/* Orders by Status Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-[300px]">
                <Doughnut
                  ref={statusChartRef}
                  data={statusChartData}
                  options={statusChartOptions}
                  key="status-chart"
                />
              </div>
            </div>
          </>
        )}

        {analytics.totalOrders === 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center">No sales data available yet.</p>
          </div>
        )}
      </div>
    );
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
      }
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
      }
    };
  }, []);


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