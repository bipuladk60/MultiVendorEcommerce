// src/pages/LoginPage.jsx
import { useState } from 'react'; // We need useState for errors
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const loginUser = async (formData) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });
  if (error) throw error;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null); // State for our error messages

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      navigate('/');
    },
    onError: (error) => {
      // Set the error message from Supabase
      setFormError(error.message);
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setFormError(null); // Clear previous errors
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
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Log In to Your Account</h2>
        
        {/* Error Display Area */}
        {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{formError}</span>
            </div>
        )}
        
        <form onSubmit={handleLogin}>
            {/* FORM FIELDS - MAKE SURE THEY HAVE 'name' ATTRIBUTES */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                <input id="email" name="email" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" type="email" placeholder="you@example.com" required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                <input id="password" name="password" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" type="password" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={mutation.isPending} className="w-full p-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                {mutation.isPending ? 'Logging In...' : 'Log In'}
            </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;