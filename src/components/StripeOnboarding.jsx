// src/components/StripeOnboarding.jsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

// API function to get the user's profile
const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return data;
};

const StripeOnboarding = () => {
    const { user } = useAuth();

    const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
        queryKey: ['profile', user?.id], // A unique key for this query
        queryFn: () => fetchProfile(user.id),
        enabled: !!user
    });

    const mutation = useMutation({
        // --- THE FIX: Use supabase.functions.invoke() with the correct name ---
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('create-connect-account');

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url; // Redirect user to Stripe
            }
        },
        onError: (error) => {
            console.error('Stripe Connect Error:', error);
            // Optionally, you can set an error state here to show in the UI
            alert(`Failed to connect with Stripe: ${error.message}`);
        }
    });

    if (profileLoading) {
        return <div className="text-gray-500">Loading Stripe status...</div>;
    }
    
    if (profileError) {
        return <div className="text-red-500">Error loading profile: {profileError.message}</div>;
    }

    if (profile?.stripe_account_id) {
        return (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                <p className="font-semibold">✓ Stripe Account Connected</p>
                <p className="text-sm mt-1">
                    Your account is ready to accept payments.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect with Stripe</h3>
            <p className="text-sm text-gray-600 mb-4">
                Connect your Stripe account to start accepting payments for your products.
            </p>
            <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
            >
                {mutation.isPending ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
            </button>
        </div>
    );
};

export default StripeOnboarding;