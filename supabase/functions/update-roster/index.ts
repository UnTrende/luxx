import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // AuthZ: require admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { rosterId, name, startDate, endDate, days } = await req.json();
    if (!rosterId || !name || !startDate || !endDate || !days) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rosterData = {
      name: String(name),
      start_date: String(startDate),
      end_date: String(endDate),
      days: days,
      updated_at: new Date().toISOString()
    } as const;

    const { data, error } = await supabaseClient
      .from('rosters')
      .update(rosterData)
      .eq('id', rosterId)
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: data?.[0] || null, message: 'Roster updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: Error | unknown) {
    console.error('update-roster error:', error, 'index');
    return new Response(JSON.stringify({ error: error.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
