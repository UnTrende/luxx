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
    const { review } = await req.json(); // { bookingId, rating, comment, barberId }
    
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found.");
    
    // 1. Mark booking as reviewLeft = true
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({ reviewLeft: true })
      .eq('id', review.bookingId)
      .eq('user_id', user.id) // Security check
      .eq('status', 'Completed')
      .select()
      .single();

    if (bookingError || !booking) throw new Error("Booking not found or review not allowed.");
    
    // 2. Insert the review
    const { error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert({
        barber_id: review.barberId,
        user_id: user.id,
        user_name: user.app_metadata.name,
        rating: review.rating,
        comment: review.comment,
        booking_id: review.bookingId,
      });

    if (reviewError) throw reviewError;

    return new Response(JSON.stringify({ success: true }), {
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