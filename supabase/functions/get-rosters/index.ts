// supabase/functions/get-rosters/index.ts
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
    // Use the service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse query parameters
    const url = new URL(req.url);
    const weekKey = url.searchParams.get('weekKey');
    const barberId = url.searchParams.get('barberId');
    const limit = url.searchParams.get('limit');

    // Build the query
    let query = supabaseClient
      .from('rosters')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (weekKey) {
      query = query.eq('week_key', weekKey);
    }

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: rosters, error } = await query;

    if (error) {
      console.error("Error fetching rosters:", error);
      throw error;
    }

    console.log("Rosters fetched:", rosters?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: rosters || [],
        count: rosters?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Error in get-rosters function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});