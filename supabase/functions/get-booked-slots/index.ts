// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    // Parse query parameters from URL instead of request body
    const url = new URL(req.url);
    const barberId = url.searchParams.get('barberId');
    const date = url.searchParams.get('date');

    if (!barberId || !date) {
      throw new Error("Barber ID and date are required.");
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('timeslot')
      .eq('barber_id', barberId) // Use correct column name
      .eq('date', date)
      .neq('status', 'cancelled');

    if (error) throw error;

    const bookedSlots = bookings.map(b => b.timeslot);

    return new Response(JSON.stringify(bookedSlots), {
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