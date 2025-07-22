// src/pages/VendorLoginPage.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const loginVendor = async (formData) => {
  // 1. Sign in the user
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });
  if (signInError) throw signInError;
  if (!user) throw new Error("Login failed: User not found after sign-in.");

  // 2. Fetch the user's profile to get their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // If profile doesn't exist, something is wrong. Log out to be safe.
    await supabase.auth.signOut();
    throw new Error(`A profile for this user could not be found. Please contact support.`);
  }

  // 3. Check if this is a customer trying to log in through the vendor login
  if (profile.role !== 'vendor') {
    await supabase.auth.signOut();
    throw new Error('Please use the customer login page if you are a customer.');
  }

  return profile;
};

const VendorLoginPage = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const mutation = useMutation({
    mutationFn: loginVendor,
    onSuccess: () => {
      // Vendors always go to the dashboard
      navigate('/vendor/dashboard');
    },
    onError: (error) => {
      setFormError(error.message);
      if (error.message.includes('customer login page')) {
        // Add a slight delay before redirecting to customer login
        setTimeout(() => navigate('/login'), 2000);
      }
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const fields = Object.fromEntries(formData.entries());

    const result = loginSchema.safeParse(fields);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }

    mutation.mutate(result.data);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Vendor Login</h2>
        
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
              placeholder="you@example.com" 
              required 
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={mutation.isPending} 
            className="w-full p-3 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            {mutation.isPending ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Are you a customer? <Link to="/login" className="text-indigo-600 hover:underline">Login here</Link>
        </p>
        <p className="text-center mt-2 text-sm">
          Don't have an account? <Link to="/signup" className="text-indigo-600 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorLoginPage;