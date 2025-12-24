import { logger } from '../_shared/response.ts';

// SECURE & OPTIMIZED VERSION - Full auth but using JWT metadata instead of DB queries
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔒 create-booking: Function started (secure & optimized)', undefined, 'index');

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // OPTIMIZED AUTH: Get user from JWT without additional DB queries
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('🔒 create-booking: Invalid token', undefined, 'index');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get role from JWT metadata (no DB query needed!)
    const userRole = user.app_metadata?.role || user.user_metadata?.role || 'customer';
    
    console.log('User authenticated for booking creation', {
      userId: user.id,
      userRole: user.role
    }, 'create-booking');

    // Only customers can create bookings
    if (userRole !== 'customer') {
      return new Response(
        JSON.stringify({ error: 'Only customers can create bookings' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { bookingDetails } = body;

    console.log('🔒 create-booking: Received booking details:', bookingDetails, 'index');
    
    // Check if this is a reward booking
    const isRewardBooking = bookingDetails.isRewardBooking || false;
    const pointsRedeemed = bookingDetails.pointsRedeemed || 0;
    
    if (isRewardBooking) {
        console.log(`🎁 REWARD BOOKING: Customer redeeming ${pointsRedeemed} points`, undefined, 'index');
    }

    // Verify the booking is for the authenticated user
    if (bookingDetails.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot create booking for another user' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate active bookings (prevents double-booking)
    const { data: existingBookings } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('barber_id', bookingDetails.barberId)
      .eq('date', bookingDetails.date)
      .eq('timeslot', bookingDetails.timeSlot)
      .in('status', ['pending', 'confirmed']);

    if (existingBookings && existingBookings.length > 0) {
      console.log('🔒 create-booking: Slot already booked', undefined, 'index');
      return new Response(
        JSON.stringify({ error: 'This time slot is no longer available. Please select another time.' }), 
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create booking data
    const newBooking = {
      user_id: user.id, // Use authenticated user ID
      username: bookingDetails.userName,
      barber_id: bookingDetails.barberId,
      service_ids: bookingDetails.serviceIds,
      date: bookingDetails.date,
      timeslot: bookingDetails.timeSlot,
      totalprice: bookingDetails.totalPrice,
      status: 'confirmed',
      reviewleft: false,
      is_reward_booking: isRewardBooking,
      points_redeemed: pointsRedeemed
    };
    
    console.log('🔒 create-booking: Booking type:', isRewardBooking ? '🎁 REWARD' : '💰 REGULAR', 'index');

    console.log('🔒 create-booking: Attempting to insert booking', undefined, 'index');

    // Insert booking
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(newBooking)
      .select()
      .single();

    if (error) {
      console.error('🔒 create-booking: Insert failed:', error, 'index');
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔒 create-booking: SUCCESS! Booking created:', data.id, 'index');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: Error | unknown) {
    console.error('🔒 create-booking: Unexpected error:', err, 'index');
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
