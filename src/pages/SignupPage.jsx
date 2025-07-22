// src/pages/SignupPage.jsx
import { useState } from 'react'; // We need state for the role toggle
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../utils/supabaseClient';

// Base schema for all users
const baseSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long.'),
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    role: z.enum(['user', 'vendor']),
});

// Additional schema for vendors
const vendorSchema = z.object({
    business_name: z.string().min(2, 'Business name is required.'),
    phone: z.string().min(10, 'A valid phone number is required.'),
    address: z.string().min(10, 'A full address is required.'),
    support_email: z.string().email('A valid support email is required.'),
});

// This function will create the final schema based on the role
const getFinalSchema = (role) => {
    if (role === 'vendor') {
        return baseSchema.merge(vendorSchema);
    }
    return baseSchema;
};

// The mutation function remains the same, Supabase handles the 'options.data' part
const signupUser = async (formData) => {
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: formData, // Pass all form data into the options
    },
  });
  if (error) throw error;
};

const SignupPage = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('user'); // State to toggle form fields
    const [formError, setFormError] = useState(null);

    const mutation = useMutation({
        mutationFn: signupUser,
        onSuccess: () => {
            alert('Signup successful! You can now log in.');
            navigate('/login');
        },
        onError: (error) => setFormError(error.message),
    });

    const handleSignup = (e) => {
        e.preventDefault();
        setFormError(null);
        const formData = new FormData(e.currentTarget);
        const fields = Object.fromEntries(formData.entries());
        
        // Validate against the correct schema based on the selected role
        const finalSchema = getFinalSchema(fields.role);
        const result = finalSchema.safeParse(fields);

        if (!result.success) {
            setFormError(result.error.issues[0].message);
            return;
        }
        mutation.mutate(result.data);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 py-12">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Your Account</h2>
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {formError}
                    </div>
                )}
                <form onSubmit={handleSignup} className="space-y-4">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                        <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white">
                            <option value="user">I'm a Customer</option>
                            <option value="vendor">I'm a Vendor</option>
                        </select>
                    </div>

                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
                            <input id="username" name="username" type="text" required className="w-full p-3 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Login Email</label>
                            <input id="email" name="email" type="email" required className="w-full p-3 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" required className="w-full p-3 border border-gray-300 rounded-md"/>
                    </div>
                    
                    {/* Vendor-Specific Fields */}
                    {role === 'vendor' && (
                        <div className="p-4 border-t border-gray-200 mt-6 space-y-4">
                            <h3 className="font-semibold text-lg text-gray-700">Business Information</h3>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="business_name">Business Name</label>
                                <input id="business_name" name="business_name" type="text" required className="w-full p-3 border border-gray-300 rounded-md"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">Phone Number</label>
                                    <input id="phone" name="phone" type="tel" required className="w-full p-3 border border-gray-300 rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="support_email">Customer Support Email</label>
                                    <input id="support_email" name="support_email" type="email" required className="w-full p-3 border border-gray-300 rounded-md"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">Full Business Address</label>
                                <input id="address" name="address" type="text" required className="w-full p-3 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={mutation.isPending} className="w-full p-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                        {mutation.isPending ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;