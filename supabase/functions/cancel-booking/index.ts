// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    
    // Authenticate user
    const user = await authenticateUser(req);

    // Update the booking status if it belongs to the user
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' }) // Use correct status value per constraint
      .eq('id', bookingId)
      .eq('user_id', user.id) // Security check
      .select()
      .single();
    if (updateError) throw updateError;
    
    // Create notification for barber
    await supabaseAdmin
        .from('notifications')
        .insert({
            recipient_id: updatedBooking.barber_id,
            type: 'BOOKING_CANCELLED_BY_CUSTOMER',
            message: `Booking with ${updatedBooking.username} for ${updatedBooking.date} at ${updatedBooking.timeslot} was cancelled.`,
            payload: { bookingId: updatedBooking.id }
        });


    return new Response(JSON.stringify({ success: true }), {
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