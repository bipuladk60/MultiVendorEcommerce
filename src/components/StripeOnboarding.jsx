// src/components/StripeOnboarding.jsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

// API function to get the user's profile, including the Stripe ID
const fetchProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('stripe_account_id').eq('id', userId).single();
    if (error) throw error;
    return data;
};

// API function to call our Edge Function
const createConnectAccount = async () => {
    const { data, error } = await supabase.functions.invoke('create-connect-account');
    if (error) throw error;
    return data;
};

const StripeOnboarding = () => {
    const { user } = useAuth();
    // Fetch the user's profile to check for an existing Stripe ID
    const { data: profile, isLoading } = useQuery({ 
        queryKey: ['profile', user?.id], 
        queryFn: () => fetchProfile(user.id), 
        enabled: !!user 
    });
    
    // Setup the mutation to call our Edge Function
    const mutation = useMutation({
        mutationFn: createConnectAccount,
        onSuccess: (data) => {
            // On success, redirect the user to the URL provided by Stripe
            if (data.url) {
                window.location.href = data.url;
            }
        },
        onError: (error) => alert(`Error: ${error.message}`)
    });

    if (isLoading) {
        return <div className="text-gray-500">Loading Stripe status...</div>;
    }

    // If the user already has a Stripe ID, show a success message
    if (profile?.stripe_account_id) {
        return <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-semibold">✓ Stripe Account Connected</div>;
    }

    // Otherwise, show the onboarding button
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect with Stripe</h3>
            <p className="text-sm text-gray-600 mb-4">Connect your Stripe account to receive payments for your sales.</p>
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