// src/pages/StripeReturnPage.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

const StripeReturnPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accountId = params.get('account_id');

        // If we have a user and an account ID from the URL, save it
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
                }
                // In all cases, navigate back to the dashboard
                navigate('/dashboard');
            };
            saveStripeId();
        } else if (user) {
            // If there's no account ID, just go back to the dashboard
            navigate('/dashboard');
        }
    }, [user, location, navigate]);

    return <div className="p-8 text-center text-xl">Finalizing Stripe Connection... Please wait.</div>;
};

export default StripeReturnPage;