// supabase/functions/delete-user/index.ts
// Use a much newer, more stable version of the Deno standard library
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// Use a newer version of the Stripe library from esm.sh
import Stripe from "https://esm.sh/stripe@15.8.0?target=deno";
// Use a newer version of the Supabase library from esm.sh
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create an Admin client. This is the only client we need.
    const adminClient = createClient(
      Deno.env.get('PROJECT_URL')!,
      Deno.env.get('SERVICE_KEY')!
    );

    // --- THIS IS THE NEW, MORE ROBUST METHOD ---
    // 1. Get the Authorization header from the incoming request.
    const authHeader = req.headers.get('Authorization')!;
    
    // 2. Extract the JWT from the "Bearer <token>" string.
    const jwt = authHeader.replace('Bearer ', '');

    // 3. Use the JWT to get the user's data and validate the token.
    // This is a more direct way to authenticate on the server.
    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);

    if (userError) {
      // This will throw if the token is invalid or expired
      throw userError;
    }
    if (!user) {
      throw new Error("User not found or token is invalid.");
    }
    // --- END OF NEW METHOD ---


    // Now we have the authenticated user's ID, we can perform the admin delete.
    // The database cascade we set up will handle deleting profiles and products.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      // This will throw if there's an issue with the deletion itself.
      throw deleteError;
    }

    return new Response(JSON.stringify({ message: "Account deleted successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in delete-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});