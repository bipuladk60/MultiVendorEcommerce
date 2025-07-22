// // src/components/VendorProfileSettings.jsx
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { supabase } from '../utils/supabaseClient';
// import { useAuth } from '../context/AuthContext';
// import { useState, useEffect } from 'react';
// import { z } from 'zod';

// // Zod schema for validation
// const profileSchema = z.object({
//     business_name: z.string().min(3, 'Business name must be at least 3 characters.'),
// });

// // API function to fetch the vendor's profile
// const fetchVendorProfile = async (userId) => {
//     const { data, error } = await supabase.from('profiles').select('business_name').eq('id', userId).single();
//     if (error) throw error;
//     return data;
// };

// // API function to update the vendor's profile
// const updateVendorProfile = async ({ userId, updates }) => {
//     const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
//     if (error) throw error;
// };

// const VendorProfileSettings = () => {
//     const { user } = useAuth();
//     const queryClient = useQueryClient();
//     const [businessName, setBusinessName] = useState('');
//     const [formError, setFormError] = useState(null);

//     // Fetch the current profile data
//     const { data: profile, isLoading } = useQuery({
//         queryKey: ['vendorProfile', user?.id],
//         queryFn: () => fetchVendorProfile(user.id),
//         enabled: !!user,
//     });

//     // When profile data loads, populate the form field
//     useEffect(() => {
//         if (profile) {
//             setBusinessName(profile.business_name || '');
//         }
//     }, [profile]);
    
//     // Mutation for updating the profile
//     const mutation = useMutation({
//         mutationFn: updateVendorProfile,
//         onSuccess: () => {
//             alert('Profile updated successfully!');
//             // Invalidate the query to refetch the fresh data
//             queryClient.invalidateQueries({ queryKey: ['vendorProfile', user?.id] });
//         },
//         onError: (error) => {
//             setFormError(error.message);
//         }
//     });

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         setFormError(null);
        
//         const result = profileSchema.safeParse({ business_name: businessName });
//         if (!result.success) {
//             setFormError(result.error.issues[0].message);
//             return;
//         }

//         mutation.mutate({ userId: user.id, updates: { business_name: result.data.business_name } });
//     };

//     if (isLoading) return <div>Loading profile...</div>;

//     return (
//         <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">Business Profile</h3>
//             {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                     <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name</label>
//                     <input
//                         type="text"
//                         id="business_name"
//                         value={businessName}
//                         onChange={(e) => setBusinessName(e.target.value)}
//                         className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                 </div>
//                 <button
//                     type="submit"
//                     disabled={mutation.isPending}
//                     className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
//                 >
//                     {mutation.isPending ? 'Saving...' : 'Save Profile'}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default VendorProfileSettings;