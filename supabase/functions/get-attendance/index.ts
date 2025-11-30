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
    // 1. Authenticate user and check for admin role
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
    
    // Check if user is admin
    if (user.app_metadata.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required.");
    }
    
    // Get date parameter or use today
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // 2. Fetch attendance records for the specified date
    const { data: attendance, error } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('date', date)
        .order('clock_in', { ascending: true });
        
    if (error) throw error;

    // Map database fields to camelCase to match the Attendance interface
    const formattedAttendance = attendance.map(record => ({
      barberId: record.barber_id,
      barberName: record.barber_name,
      status: record.status,
      date: record.date,
      clockIn: record.clock_in,
      clockOut: record.clock_out,
      breakStart: record.break_start,
      breakEnd: record.break_end,
      breakDuration: record.break_duration,
      workingHours: record.working_hours,
      scheduledStartTime: record.scheduled_start_time,
      scheduledEndTime: record.scheduled_end_time
    }));

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