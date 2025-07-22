// src/components/StripeOnboarding.jsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

// API function to get the user's profile
const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_completed')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return data;
};

const StripeOnboarding = () => {
    const { user } = useAuth();
    const [error, setError] = useState(null);

    // Fetch the user's profile to check Stripe status
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: () => fetchProfile(user.id),
        enabled: !!user
    });

    // Mutation for creating Stripe Connect account
    const mutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session found');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to connect with Stripe');
            return result;
        },
        onSuccess: (data) => {
            // Redirect to Stripe onboarding
            window.location.href = data.url;
        },
        onError: (error) => {
            setError(error.message);
            console.error('Stripe Connect Error:', error);
        }
    });

    if (profileLoading) {
        return <div className="text-gray-500">Loading Stripe status...</div>;
    }

    // If there's an error, show it
    if (error) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error connecting to Stripe:</p>
                <p>{error}</p>
                <button 
                    onClick={() => setError(null)}
                    className="mt-2 text-sm underline hover:no-underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // If the user has a Stripe account
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

    // Show connect button if no Stripe account
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect with Stripe</h3>
            <p className="text-sm text-gray-600 mb-4">
                Connect your Stripe account to start accepting payments for your products.
            </p>
            <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg 
                         hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
            >
                {mutation.isPending ? 'Connecting...' : 'Connect with Stripe'}
            </button>
        </div>
    );
};

export default StripeOnboarding;