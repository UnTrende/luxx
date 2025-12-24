// supabase/functions/get-barber-roster/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';
import { logger } from '../_shared/response.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Function started', undefined, 'index');
    
    // Authenticate user
    const user = await authenticateUser(req);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Getting roster for user ID:', user.id, 'index');
    
    // First, get the barber profile for this user to get the barber ID
    const { data: barberProfile, error: barberError } = await supabaseClient
      .from('barbers')
      .select('id, user_id, name')
      .eq('user_id', user.id)
      .single();
      
    console.log('🔍 Barber profile query result:', { barberProfile, barberError }, 'index');

    if (barberError || !barberProfile) {
      console.log('❌ No barber profile found for user:', user.id, 'index');
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found barber profile', { 
      barberId: barber.id, 
      barberName: barber.name 
    }, 'get-barber-roster');

    // Get all rosters
    const { data: rosters, error } = await supabaseClient
      .from('rosters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📋 Total rosters found:', rosters?.length, 'index');
    
    // If no rosters exist, return empty array
    if (!rosters || rosters.length === 0) {
      console.log('📭 No rosters found in database', undefined, 'index');
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter rosters for this barber with error handling
    const barberRosters = rosters.map(roster => {
      try {
        console.log(`🔍 Processing roster ${roster.name || roster.id} for barber ${barberProfile.id} (${barberProfile.name})`, undefined, 'index');
        
        // Handle different roster data structures
        let daysData = [];
        if (roster.days && Array.isArray(roster.days)) {
          daysData = roster.days;
          console.log(`✅ Found days array with ${daysData.length} items`, undefined, 'index');
        } else if (roster.schedules && roster.schedules.days && Array.isArray(roster.schedules.days)) {
          daysData = roster.schedules.days;
          console.log(`✅ Found schedules.days with ${daysData.length} days`, undefined, 'index');
        } else if (roster.schedules && Array.isArray(roster.schedules)) {
          daysData = roster.schedules;
          console.log(`✅ Found schedules array with ${daysData.length} items`, undefined, 'index');
        } else {
          console.log(`❌ No valid days data found in roster structure`, undefined, 'index');
        }
        
        // Filter days to only include shifts for this barber
        const barberDays = daysData.map((day: unknown) => {
          const filteredShifts = (day.shifts && Array.isArray(day.shifts) ? day.shifts : []).filter((shift: unknown) => {
            const match = shift.barberId === barberProfile.id;
            console.log(`  🔄 Checking shift - barberId: ${shift.barberId}, barberProfile.id: ${barberProfile.id}, match: ${match}`, undefined, 'index');
            return match;
          });
          
          return {
            date: day.date,
            shifts: filteredShifts
          };
        }).filter((day: unknown) => day.shifts && day.shifts.length > 0);

        console.log(`📅 Roster ${roster.name || roster.id}: ${barberDays.length} days with shifts`, undefined, 'index');

        // Return the roster with the correct structure for the frontend
        return {
          id: roster.id,
          name: roster.name,
          start_date: roster.start_date,
          end_date: roster.end_date,
          week_dates: roster.week_dates || { start: roster.start_date, end: roster.end_date },
          days: barberDays,
          schedules: {
            rosterName: roster.name,
            days: barberDays
          }
        };
      } catch (error) {
        console.error(`❌ Error processing roster ${roster.id}:`, error, 'index');
        // Return empty roster structure to avoid breaking the filter
        return {
          id: roster.id,
          name: roster.name || 'Unknown',
          start_date: roster.start_date,
          end_date: roster.end_date,
          week_dates: roster.week_dates || { start: null, end: null },
          days: [],
          schedules: {
            rosterName: roster.name || 'Unknown',
            days: []
          }
        };
      }
    }).filter(roster => roster.days && roster.days.length > 0);

    console.log('🎯 Final barber rosters count:', barberRosters.length, 'index');
    console.log('🎯 Final barber rosters data:', JSON.stringify(barberRosters, null, 2, 'index'));

    return new Response(
      JSON.stringify(barberRosters),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});