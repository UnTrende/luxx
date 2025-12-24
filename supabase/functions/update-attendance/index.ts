/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  console.log('[Edge Function] update-attendance called', undefined, 'index');
  
  if (req.method === 'OPTIONS') {
    console.log('[Edge Function] Handling OPTIONS request', undefined, 'index');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log the request for debugging
    console.log('[Edge Function] Request headers:', Object.fromEntries(req.headers, 'index'));
    console.log('[Edge Function] Authorization header:', req.headers.get('Authorization', 'index'));
    console.log('[Edge Function] Request method:', req.method, 'index');
    
    // Get the request data
    let requestData;
    try {
      requestData = await req.json();
      console.log('[Edge Function] Request data:', requestData, 'index');
    } catch (parseError) {
      console.error('[Edge Function] Failed to parse request body:', parseError, 'index');
      throw new Error("Invalid request body format");
    }
    
    const { action, date } = requestData;
    console.log('[Edge Function] Parsed action:', action, 'date:', date, 'index');
    // action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break' | 'mark-present' | 'mark-absent'

    // 1. Authenticate user
    const user = await authenticateUser(req);
    console.log('[Edge Function] User authenticated successfully', undefined, 'index');

    // 2. Get the barber ID from the barbers table using the user ID
    console.log('[Edge Function] Looking up barber ID for user ID:', user.id, 'index');
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id, name')
      .eq('user_id', user.id)
      .single();
      
    if (barberError) {
      console.error('[Edge Function] Error looking up barber:', barberError, 'index');
      throw new Error(`Barber not found for user ID: ${user.id}`);
    }
    
    if (!barber) {
      console.error('[Edge Function] No barber found for user ID:', user.id, 'index');
      throw new Error(`Barber not found for user ID: ${user.id}`);
    }
    
    console.log('[Edge Function] Found barber:', barber, 'index');
    const barberId = barber.id;
    const barberName = barber.name;

    const today = date || new Date().toISOString().split('T')[0];
    console.log('[Edge Function] Today date:', today, 'index');

    // For backward compatibility with the old system
    if (action === 'mark-present' || action === 'mark-absent') {
      console.log('[Edge Function] Handling backward compatibility action:', action, 'index');
      const status = action === 'mark-present' ? 'Present' : 'Absent';
      console.log('[Edge Function] Status:', status, 'index');
      
      // Check if attendance record exists
      console.log('[Edge Function] Checking for existing attendance record for barber:', barberId, 'date:', today, 'index');
      const { data: existing } = await supabaseAdmin
        .from('attendance')
        .select('id')
        .eq('barber_id', barberId)
        .eq('date', today)
        .single();

      console.log('[Edge Function] Existing record:', existing, 'index');

      if (existing) {
        console.log('[Edge Function] Updating existing record', undefined, 'index');
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from('attendance')
          .update({
            status: status
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('[Edge Function] Update error:', error, 'index');
          throw error;
        }
        
        console.log('[Edge Function] Update successful:', data, 'index');
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Attendance updated to ${status}`,
          attendance: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        console.log('[Edge Function] Creating new record', undefined, 'index');
        // Create new record
        const { data, error } = await supabaseAdmin
          .from('attendance')
          .insert({ 
            barber_id: barberId,
            date: today,
            status: status
          })
          .select()
          .single();

        if (error) {
          console.error('[Edge Function] Insert error:', error, 'index');
          throw error;
        }
        
        console.log('[Edge Function] Insert successful:', data, 'index');
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Attendance record created and set to ${status}`,
          attendance: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Check if attendance record exists
    console.log('[Edge Function] Checking for existing attendance record for barber:', barberId, 'date:', today, 'index');
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('barber_id', barberId)
      .eq('date', today)
      .single();

    console.log('[Edge Function] Existing record:', existing, 'index');

    const now = new Date().toISOString();
    console.log('[Edge Function] Current time:', now, 'index');

    if (action === 'clock-in') {
      console.log('[Edge Function] Handling clock-in action', undefined, 'index');
      if (existing && (existing.status === 'clocked-in' || existing.status === 'on-break')) {
        console.log('[Edge Function] Already clocked in', undefined, 'index');
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Already clocked in today'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      if (existing) {
        console.log('[Edge Function] Updating existing record for clock-in', undefined, 'index');
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from('attendance')
          .update({
            clock_in: now,
            status: 'clocked-in',
            working_hours: 0
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('[Edge Function] Update error:', error, 'index');
          throw error;
        }
        
        console.log('[Edge Function] Update successful:', data, 'index');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Clocked in successfully',
          attendance: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        console.log('[Edge Function] Creating new record for clock-in', undefined, 'index');
        // Create new record
        const { data, error } = await supabaseAdmin
          .from('attendance')
          .insert({ 
            barber_id: barberId,
            date: today,
            clock_in: now,
            status: 'clocked-in',
            working_hours: 0
          })
          .select()
          .single();

        if (error) {
          console.error('[Edge Function] Insert error:', error, 'index');
          throw error;
        }
        
        console.log('[Edge Function] Insert successful:', data, 'index');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Clocked in successfully',
          attendance: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    if (!existing) {
      console.log('[Edge Function] No existing record found', undefined, 'index');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No clock-in record found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (action === 'clock-out') {
      console.log('[Edge Function] Handling clock-out action', undefined, 'index');
      const clockIn = new Date(existing.clock_in);
      const clockOut = new Date(now);
      const workingHours = ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2);

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({
          clock_out: now,
          status: 'clocked-out',
          working_hours: parseFloat(workingHours)
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Edge Function] Update error:', error, 'index');
        throw error;
      }
      
      console.log('[Edge Function] Update successful:', data, 'index');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Clocked out successfully',
        attendance: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'start-break') {
      console.log('[Edge Function] Handling start-break action', undefined, 'index');
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({
          break_start: now,
          status: 'on-break'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Edge Function] Update error:', error, 'index');
        throw error;
      }
      
      console.log('[Edge Function] Update successful:', data, 'index');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Break started successfully',
        attendance: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'end-break') {
      console.log('[Edge Function] Handling end-break action', undefined, 'index');
      const breakStart = new Date(existing.break_start);
      const breakEnd = new Date(now);
      const breakDuration = Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({
          break_end: now,
          break_duration: breakDuration,
          status: 'clocked-in'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Edge Function] Update error:', error, 'index');
        throw error;
      }
      
      console.log('[Edge Function] Update successful:', data, 'index');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Break ended successfully',
        attendance: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('[Edge Function] Invalid action:', action, 'index');
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Invalid action'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error) {
    console.error('[Edge Function] Error in update-attendance function:', error, 'index');
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});