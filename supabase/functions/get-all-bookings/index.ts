// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateAdmin } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user and check for admin role
    const admin = await authenticateAdmin(req);

    // 2. Fetch all bookings
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('date', { ascending: false })
      .order('timeslot', { ascending: false });

    if (error) throw error;

    // Map to consistent camelCase format (same as barber endpoint)
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
      createdAt: booking.created_at || booking.date  // Add created_at with fallback
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