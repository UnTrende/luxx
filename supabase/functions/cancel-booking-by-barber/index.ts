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
    const { bookingId, reason } = await req.json();
    
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: barberUser }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!barberUser || barberUser.app_metadata.role !== 'barber') {
        throw new Error("Unauthorized: Barber access required.");
    }
    
    // First, find the barber record for this user
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id')
      .eq('user_id', barberUser.id)  // Correct column name
      .single();
    
    if (barberError) throw barberError;

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'Canceled', cancelMessage: reason })
      .eq('id', bookingId)
      .eq('barber_id', barber.id) // Security check with correct column name and barber ID
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(updatedBooking), {
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