// supabase/functions/is-barber-available/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const url = new URL(req.url);
    const barberId = url.searchParams.get('barberId');
    const date = url.searchParams.get('date');

    if (!barberId || !date) {
      return new Response(
        JSON.stringify({ error: 'Barber ID and date are required', available: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's a roster for this barber on this date
    const { data: rosters, error } = await supabaseClient
      .from('rosters')
      .select('days')
      .lte('start_date', date)
      .gte('end_date', date);

    if (error) {
      console.error('Error fetching rosters:', error, 'index');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch roster data', available: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no rosters exist for this date range, assume barber is available
    if (!rosters || rosters.length === 0) {
      return new Response(
        JSON.stringify({ available: true, reason: 'No roster found for date range' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the barber has a shift on this specific date
    let isAvailable = false;
    
    for (const roster of rosters) {
      if (roster.days && Array.isArray(roster.days)) {
        for (const day of roster.days) {
          if (day.date === date) {
            // Check if there are shifts for this barber on this day
            if (day.shifts && Array.isArray(day.shifts)) {
              const barberShifts = day.shifts.filter((shift: unknown) => 
                shift.barberId === barberId && !shift.isDayOff
              );
              
              if (barberShifts.length > 0) {
                isAvailable = true;
                break;
              }
            }
          }
        }
        
        if (isAvailable) break;
      }
    }

    return new Response(
      JSON.stringify({ 
        available: isAvailable,
        reason: isAvailable ? 'Barber has scheduled shifts' : 'Barber is off duty'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message, available: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});