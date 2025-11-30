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
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    console.log('get-barber-schedule: Auth header:', req.headers.get('Authorization'));
    const { data: { user }, error: userError } = await client.auth.getUser();
    console.log('get-barber-schedule: User data:', user);
    
    if (userError) {
      console.error('get-barber-schedule: User auth failed:', userError);
      throw userError;
    }
    
    if (!user) {
      console.error('get-barber-schedule: No user found');
      throw new Error("User not found.");
    }
    
    if (user.app_metadata.role !== 'barber') {
      console.error('get-barber-schedule: User is not a barber, role:', user.app_metadata.role);
      throw new Error("Unauthorized: Barber access required.");
    }

    // First, find the barber record for this user
    console.log('get-barber-schedule: Looking up barber for user ID:', user.id);
    
    // First, let's see all barbers to understand the data structure
    const { data: allBarbers, error: allBarbersError } = await supabaseAdmin
      .from('barbers')
      .select('*');
    
    console.log('get-barber-schedule: All barbers in database:', allBarbers);
    
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    console.log('get-barber-schedule: Barber lookup result:', { barber, barberError });
    
    if (barberError) {
      console.error('get-barber-schedule: Barber lookup failed:', barberError);
      // Let's also try a more general query to see what we get
      const { data: barbersByUserId, error: generalError } = await supabaseAdmin
        .from('barbers')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('get-barber-schedule: General barber query result:', { barbersByUserId, generalError });
      
      throw barberError;
    }
    
    if (!barber) {
      console.error('get-barber-schedule: No barber found for user ID:', user.id);
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Use date without time component to match DATE type in database
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    console.log('get-barber-schedule: Querying for date:', todayString);
    console.log('get-barber-schedule: Today date object:', today);
    
    // Also try alternative date formats that might be in the database
    const alternativeDate1 = new Date();
    alternativeDate1.setDate(alternativeDate1.getDate());
    const alternativeDateString1 = alternativeDate1.toISOString().split('T')[0];
    console.log('get-barber-schedule: Alternative date format 1:', alternativeDateString1);
    
    console.log('get-barber-schedule: Looking for bookings for barber ID:', barber.id, 'on date:', todayString);
    
    // First, let's see what bookings exist at all for this barber (without date filter)
    console.log('get-barber-schedule: Checking all bookings for barber_id:', barber.id);
    const { data: allBookingsForBarber, error: allBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('barber_id', barber.id)
      .neq('status', 'Canceled');
      
    console.log('get-barber-schedule: All bookings for barber:', { allBookingsForBarber, allBookingsError });
    
    // Also check what dates exist in the database for this barber
    if (allBookingsForBarber && allBookingsForBarber.length > 0) {
      const dates = [...new Set(allBookingsForBarber.map(b => b.date))];
      console.log('get-barber-schedule: Available dates for this barber:', dates);
      
      // Let's also check the data types of the dates
      allBookingsForBarber.forEach((booking, index) => {
        console.log(`get-barber-schedule: Booking ${index} date type:`, typeof booking.date, 'value:', booking.date);
      });
    }
    
    // Let's also check all bookings in the database to see what dates exist
    const { data: allBookings, error: allBookingsGeneralError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .limit(10);
      
    if (allBookings && allBookings.length > 0) {
      console.log('get-barber-schedule: Sample of all bookings in database:');
      allBookings.forEach((booking, index) => {
        console.log(`  Booking ${index}: date=${booking.date}, barber_id=${booking.barber_id}, status=${booking.status}`);
      });
    }
    
    // Now get bookings for this barber using the correct column name
    console.log('get-barber-schedule: Querying bookings for barber_id:', barber.id);
    const { data: schedule, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('barber_id', barber.id) // Use correct column name and barber ID
      .neq('status', 'Canceled')
      .order('date', { ascending: true })
      .order('timeslot', { ascending: true });
    
    console.log('get-barber-schedule: Bookings query result:', { schedule, error });
    
    if (error) {
      console.error('get-barber-schedule: Bookings query failed:', error);
      throw error;
    }
    
    console.log('get-barber-schedule: Found', schedule.length, 'bookings for today');
    
    // Map database column names to JavaScript property names
    const mappedBookings = schedule.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      userName: booking.userName,
      barberId: booking.barber_id,
      serviceIds: booking.service_ids,
      date: booking.date,
      timeSlot: booking.timeSlot,
      totalPrice: booking.totalPrice,
      status: booking.status,
      reviewLeft: booking.reviewLeft,
      cancelMessage: booking.cancelMessage
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