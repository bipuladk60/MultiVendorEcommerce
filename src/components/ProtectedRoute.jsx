// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import AccessDeniedPage from '../pages/AccessDeniedPage';

// This function fetches the user's profile from the 'profiles' table
const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    // Use TanStack Query to fetch the profile
    const { data: profile, isLoading, isError } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: () => fetchUserProfile(user.id),
        enabled: !!user, // Only run the query if the user exists
    });

    // 1. While loading, show a loading indicator
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    // 2. If there's an error fetching or the user is not a vendor, redirect
    if (isError || !user || profile?.role !== 'vendor') {
        return <AccessDeniedPage />;
    }

    // 3. If everything is fine, render the children
    return children;
};

export default ProtectedRoute;