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
    // 1. Create a Supabase client with the user's auth token
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // 2. Get the user from the token
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found.");

    // 3. Fetch bookings belonging to the user
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        barbers (id, name)
      `)
      .eq('user_id', user.id);
    
    if (bookingsError) throw bookingsError;
    
    // Map database column names to JavaScript property names
    const mappedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      userName: booking.username,
      barberId: booking.barber_id,
      serviceIds: booking.service_ids,
      date: booking.date,
      timeSlot: booking.timeslot,
      totalPrice: booking.totalprice,
      status: booking.status,
      reviewLeft: booking.reviewleft,
      cancelMessage: booking.cancelmessage,
      barbers: booking.barbers
    }));
    
    return new Response(JSON.stringify(mappedBookings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});