// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// This is our reusable query function to get the FULL profile from the database.
const fetchFullUserProfile = async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.error("Error fetching full user profile:", error);
        return null;
    }
    return data;
};

const AuthProvider = ({ children }) => {
    // This 'user' comes directly from Supabase Auth, including metadata.
    const [user, setUser] = useState(null);
    // This 'loading' tracks the initial, one-time session check.
    const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
    const queryClient = useQueryClient();

    // --- Part 1: Real-time Auth Listener ---
    useEffect(() => {
        // Get the initial session as soon as the app loads.
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setInitialAuthCheckComplete(true); // Mark the initial check as done.
        };

        getInitialSession();

        // Listen for any changes in auth state (SIGN_IN, SIGN_OUT, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const newUser = session?.user ?? null;
                setUser(newUser);
                // When auth state changes, we must ensure our cached profile is up-to-date.
                // InvalidateQueries will trigger the useQuery below to refetch.
                if (newUser) {
                    queryClient.invalidateQueries({ queryKey: ['fullProfile', newUser.id] });
                } else {
                    // If user signs out, remove all profile data from the cache.
                    queryClient.removeQueries({ queryKey: ['fullProfile'] });
                }
            }
        );

        return () => subscription?.unsubscribe();
    }, [queryClient]);


    // --- Part 2: TanStack Query for Full Profile Data ---
    const { data: fullProfile, isLoading: isProfileLoading } = useQuery({
        // The key is unique to the logged-in user.
        queryKey: ['fullProfile', user?.id],
        // Use our function to fetch the complete profile from the database.
        queryFn: () => fetchFullUserProfile(user?.id),
        // CRITICAL: Only run this query if the user object exists.
        enabled: !!user,
    });

    // --- The Combined, Final State ---
    // The App is considered "loading" if the initial auth check isn't done,
    // OR if we have a user but are still waiting for their full profile to load.
    const isLoading = !initialAuthCheckComplete || (!!user && isProfileLoading);

    // For immediate access to the role, we can create a temporary "light profile"
    // This prevents UI flicker.
    const lightProfile = user ? {
        role: user.user_metadata?.role || 'user',
        username: user.user_metadata?.username,
    } : null;

    // We provide the full, database-driven profile when available, but fall back
    // to the light profile. This gives the best of both worlds: speed and data consistency.
    const profile = fullProfile || lightProfile;

    const value = {
        user,
        profile,
        loading: isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;