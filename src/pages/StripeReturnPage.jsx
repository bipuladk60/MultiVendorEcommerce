// src/pages/StripeReturnPage.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

const StripeReturnPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // Initialize query client

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accountId = params.get('account_id');

        if (user && accountId) {
            const saveStripeId = async () => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ stripe_account_id: accountId })
                    .eq('id', user.id);

                if (error) {
                    alert('Error saving Stripe account info: ' + error.message);
                } else {
                    alert('Stripe account connected successfully!');
                    // Invalidate the profile query to force a refetch on the dashboard
                    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
                }
                // --- THE FIX: Redirect to the correct vendor dashboard path ---
                navigate('/vendor/dashboard');
            };
            saveStripeId();
        } else if (user) {
            // If there's an issue, still send them back to the right place
            navigate('/vendor/dashboard');
        }
    }, [user, location, navigate, queryClient]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="text-center">
                <p className="text-xl font-semibold text-gray-700">Finalizing Stripe Connection...</p>
                <p className="text-gray-500">Please wait, you will be redirected shortly.</p>
            </div>
        </div>
    );
};

export default StripeReturnPage;