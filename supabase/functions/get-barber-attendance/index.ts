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
    // 1. Authenticate user
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      throw new Error("Unauthorized: User not authenticated.");
    }

    // 2. Get the barber ID from the barbers table using the user ID
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (barberError) {
      throw new Error(`Barber not found for user ID: ${user.id}`);
    }
    
    if (!barber) {
      throw new Error(`Barber not found for user ID: ${user.id}`);
    }
    
    const barberId = barber.id;

    // Get date parameter or use today
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch attendance record for this barber
    const { data: attendance, error } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', date)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }

    // Map database fields to camelCase to match the Attendance interface
    const formattedAttendance = attendance ? {
      barberId: attendance.barber_id,
      barberName: attendance.barber_name,
      status: attendance.status,
      date: attendance.date,
      clockIn: attendance.clock_in,
      clockOut: attendance.clock_out,
      breakStart: attendance.break_start,
      breakEnd: attendance.break_end,
      breakDuration: attendance.break_duration,
      workingHours: attendance.working_hours,
      scheduledStartTime: attendance.scheduled_start_time,
      scheduledEndTime: attendance.scheduled_end_time
    } : null;

    return new Response(JSON.stringify({ 
      success: true,
      attendance: formattedAttendance
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});