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
    // Log the incoming request for debugging
    console.log("add-barber function called");
    
    // 1. Authenticate user and check for admin role
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await client.auth.getUser();
    console.log("User authentication result:", { user: user?.id, error: userError?.message });
    
    if (userError) throw userError;
    if (!user || user.app_metadata.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required.");
    }
    
    // 2. Get the barber data
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    if (!requestBody || !requestBody.barberData) {
      throw new Error("Missing barberData in request body.");
    }
    
    const { barberData } = requestBody;
    
    // 3. Remove ID if present to prevent conflicts
    const { id, ...cleanBarberData } = barberData;
    
    // 4. Validate required fields
    if (!cleanBarberData.name || !cleanBarberData.email || !cleanBarberData.password) {
      throw new Error("Missing required fields: name, email, and password are required.");
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanBarberData.email)) {
      throw new Error("Invalid email format.");
    }
    
    // Validate password length
    if (cleanBarberData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    
    // 5. Check if barber with same email already exists in auth.users
    const { data: existingAuthUser, error: existingUserError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', cleanBarberData.email)
      .maybeSingle();
      
    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
    }
    
    if (existingAuthUser) {
      return new Response(
        JSON.stringify({ 
          error: 'A barber with this email already exists in authentication system' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 6. Ensure specialties is an array
    let specialtiesArray: string[] = [];
    if (Array.isArray(cleanBarberData.specialties)) {
      specialtiesArray = cleanBarberData.specialties;
    } else if (typeof cleanBarberData.specialties === 'string') {
      specialtiesArray = cleanBarberData.specialties ? [cleanBarberData.specialties] : [];
    }
    
    // 7. Ensure photo is a string
    const photo = cleanBarberData.photo || '';
    
    // 8. Ensure experience is a number
    const experience = typeof cleanBarberData.experience === 'number' ? cleanBarberData.experience : 0;
    
    console.log("Validated barber data:", {
      name: cleanBarberData.name,
      email: cleanBarberData.email,
      photo,
      experience,
      specialties: specialtiesArray
    });
    
    // 9. Create the auth user for the barber (this will trigger the handle_new_user function)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanBarberData.email,
      password: cleanBarberData.password,
      email_confirm: true,
      user_metadata: { 
        name: cleanBarberData.name,
        role: 'barber'
      }
    });
    
    console.log("Auth user creation result:", { 
      userId: authUser?.user?.id, 
      error: authError?.message 
    });
    
    if (authError) throw authError;
    
    // 10. Update the app_users record with the correct role (in case the trigger didn't set it properly)
    const { error: updateError } = await supabaseAdmin
        .from('app_users')
        .update({
            role: 'barber',
            name: cleanBarberData.name
        })
        .eq('id', authUser.user.id);
        
    if (updateError) {
      console.error("Error updating app_users record:", updateError);
      // Don't throw here as the user was already created
    }

    // 11. Create the barber profile
    const { data: newBarber, error: barberError } = await supabaseAdmin
        .from('barbers')
        .insert({
            user_id: authUser.user.id,
            name: cleanBarberData.name,
            photo: photo,
            photo_path: cleanBarberData.photo_path || null, // Add photo_path
            experience: experience,
            specialties: specialtiesArray,
            active: true
        })
        .select()
        .single();
        
    console.log("Barber profile creation result:", { 
      barberId: newBarber?.id, 
      error: barberError?.message 
    });
        
    if (barberError) throw barberError;

    return new Response(JSON.stringify(newBarber), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    console.error("Error in add-barber function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});