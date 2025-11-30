// supabase/functions/get-barber-roster/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Function started');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Getting roster for user ID:', user.id);
    
    // First, get the barber profile for this user to get the barber ID
    const { data: barberProfile, error: barberError } = await supabaseClient
      .from('barbers')
      .select('id, user_id, name')
      .eq('user_id', user.id)
      .single();
      
    console.log('🔍 Barber profile query result:', { barberProfile, barberError });

    if (barberError || !barberProfile) {
      console.log('❌ No barber profile found for user:', user.id);
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👤 Found barber profile:', { 
      barberId: barberProfile.id, 
      userId: barberProfile.user_id,
      name: barberProfile.name 
    });

    // Get all rosters
    const { data: rosters, error } = await supabaseClient
      .from('rosters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📋 Total rosters found:', rosters?.length);
    
    // If no rosters exist, return empty array
    if (!rosters || rosters.length === 0) {
      console.log('📭 No rosters found in database');
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter rosters for this barber with error handling
    const barberRosters = rosters.map(roster => {
      try {
        console.log(`🔍 Processing roster ${roster.name || roster.id} for barber ${barberProfile.id} (${barberProfile.name})`);
        
        // Handle different roster data structures
        let daysData = [];
        if (roster.days && Array.isArray(roster.days)) {
          daysData = roster.days;
          console.log(`✅ Found days array with ${daysData.length} items`);
        } else if (roster.schedules && roster.schedules.days && Array.isArray(roster.schedules.days)) {
          daysData = roster.schedules.days;
          console.log(`✅ Found schedules.days with ${daysData.length} days`);
        } else if (roster.schedules && Array.isArray(roster.schedules)) {
          daysData = roster.schedules;
          console.log(`✅ Found schedules array with ${daysData.length} items`);
        } else {
          console.log(`❌ No valid days data found in roster structure`);
        }
        
        // Filter days to only include shifts for this barber
        const barberDays = daysData.map((day: any) => {
          const filteredShifts = (day.shifts && Array.isArray(day.shifts) ? day.shifts : []).filter((shift: any) => {
            const match = shift.barberId === barberProfile.id;
            console.log(`  🔄 Checking shift - barberId: ${shift.barberId}, barberProfile.id: ${barberProfile.id}, match: ${match}`);
            return match;
          });
          
          return {
            date: day.date,
            shifts: filteredShifts
          };
        }).filter((day: any) => day.shifts && day.shifts.length > 0);

        console.log(`📅 Roster ${roster.name || roster.id}: ${barberDays.length} days with shifts`);

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
        console.error(`❌ Error processing roster ${roster.id}:`, error);
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

    console.log('🎯 Final barber rosters count:', barberRosters.length);
    console.log('🎯 Final barber rosters data:', JSON.stringify(barberRosters, null, 2));

    return new Response(
      JSON.stringify(barberRosters),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});