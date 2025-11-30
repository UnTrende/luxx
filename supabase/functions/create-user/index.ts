// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the requesting user and check for admin role
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: requestingUser }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!requestingUser || requestingUser.app_metadata.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required.");
    }
    
    // 2. Get the user data
    const { userData } = await req.json();
    
    // 3. Create the auth user with the specified role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { 
        name: userData.name,
        role: userData.role
      }
    });
    
    if (authError) throw authError;
    
    // 4. Create the corresponding profile in app_users table
    const { data: appUser, error: profileError } = await supabaseAdmin
        .from('app_users')
        .insert({
            id: authUser.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
        })
        .select()
        .single();
        
    if (profileError) throw profileError;

    return new Response(JSON.stringify(appUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});