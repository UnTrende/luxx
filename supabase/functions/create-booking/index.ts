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
    const { bookingDetails } = await req.json();

    // If user is authenticated, get their ID
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    // Map JavaScript property names to database column names (all lowercase)
    const newBookingData = {
      user_id: bookingDetails.userId || userId,
      username: bookingDetails.userName,  // Try lowercase
      barber_id: bookingDetails.barberId,
      service_ids: bookingDetails.serviceIds,
      date: bookingDetails.date,
      timeslot: bookingDetails.timeSlot,  // This works based on get-booked-slots
      totalprice: bookingDetails.totalPrice,  // Try lowercase
      status: 'confirmed',  // FIXED: lowercase to match database constraint
      reviewleft: false  // Try lowercase
    };

    // Insert booking
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(newBookingData)
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create notification for barber
    // Fetch Barber Name and User ID for the notification message
    const { data: barberData } = await supabaseAdmin
      .from('barbers')
      .select('name, user_id')
      .eq('id', newBooking.barber_id)
      .single();

    const barberName = barberData?.name || 'the barber';
    const barberUserId = barberData?.user_id || newBooking.barber_id; // Fallback to barber_id if user_id not found

    // Prepare Notifications
    const notifications: any[] = [];

    // 1. Notify the Barber (using user_id, not barber_id)
    notifications.push({
      recipient_id: barberUserId,
      type: 'BOOKING_CONFIRMED',
      message: `${newBooking.username} booked an appointment for ${newBooking.date} at ${newBooking.timeslot}.`,
      payload: { bookingId: newBooking.id }
    });

    // 2. Notify Admins
    const { data: admins } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      admins.forEach(admin => {
        // Prevent duplicate if barber is admin
        if (admin.id !== newBooking.barber_id) {
          notifications.push({
            recipient_id: admin.id,
            type: 'BOOKING_CONFIRMED',
            message: `New Booking: ${newBooking.username} booked ${barberName} for ${newBooking.date} at ${newBooking.timeslot}.`,
            payload: { bookingId: newBooking.id }
          });
        }
      });
    } else {
      // Fallback: If no admins in app_users, try to notify the booking creator if they are admin? No.
      console.log("No admins found in app_users table to notify.");
    }

    // Insert all notifications
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (notificationError) console.error("Failed to create notifications:", notificationError.message);


    return new Response(JSON.stringify({
      ...newBooking,
      debug: {
        notificationsSent: notifications.length,
        adminsFound: admins ? admins.length : 0,
        adminIds: admins ? admins.map(a => a.id) : [],
        barberId: newBooking.barber_id,
        notificationError: notificationError // Return error if any
      }
    }), {
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