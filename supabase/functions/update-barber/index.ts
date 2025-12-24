import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key for full access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) throw userError;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = user.app_metadata.role;
    const isAdmin = userRole === 'admin';
    const isBarber = userRole === 'barber';

    // Parse the request body - ensure it's only plain data
    const body = await req.json();
    console.log('Received barber data:', body, 'index');

    const { id, name, email, phone, services, specialties, working_hours, photo_path, photo } = body;

    // Validate required fields
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Barber ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user is a barber, verify they're updating their own profile
    if (isBarber) {
      // Get the barber record to check user_id
      const { data: barberData, error: barberError } = await supabaseClient
        .from('barbers')
        .select('user_id')
        .eq('id', id)
        .single();

      if (barberError || !barberData) {
        return new Response(
          JSON.stringify({ error: 'Barber not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if this barber belongs to the authenticated user
      if (barberData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: You can only update your own profile.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!isAdmin) {
      // If not admin and not barber, deny access
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin or Barber access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields (only for admin updates, barbers can do partial updates)
    if (isAdmin && (!name || !email)) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data - only include fields that exist and are valid
    const updateData: any = {};

    // Add fields only if they're provided
    if (name !== undefined) updateData.name = name.toString();
    if (email !== undefined) updateData.email = email.toString();
    if (phone !== undefined) updateData.phone = phone?.toString() || null;
    if (services !== undefined) updateData.services = Array.isArray(services) ? services : [];
    if (specialties !== undefined) updateData.specialties = Array.isArray(specialties) ? specialties : [];
    if (working_hours !== undefined) updateData.working_hours = Array.isArray(working_hours) ? working_hours : [];
    if (photo_path !== undefined) updateData.photo_path = photo_path?.toString() || null;
    if (photo !== undefined) updateData.photo = photo?.toString() || null; // Allow photo updates from profile page

    console.log('Update data prepared:', updateData, 'index');

    // Update the barber
    const { data, error } = await supabaseClient
      .from('barbers')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error:', error, 'index');
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data?.[0],
        message: 'Barber updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-barber function:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});