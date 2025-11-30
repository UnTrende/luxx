import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET requests for this public endpoint
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Use service role key for database access (no user authentication needed)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all settings
    const { data: settings, error } = await supabaseClient
      .from('site_settings')
      .select('*');

    // If there's an error (likely table doesn't exist), return default settings
    if (error) {
      console.warn('Site settings table not found, returning default settings:', error.message);
      
      const defaultSettings = {
        shop_name: 'LuxeCut Barber Shop',
        allow_signups: 'true',
        site_logo: 'https://picsum.photos/seed/logo/300/300'
      };
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: defaultSettings
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to simple key-value object
    const settingsObj: any = {};
    settings?.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    console.log('⚙️ Settings loaded:', Object.keys(settingsObj));

    // Return wrapped response to match expected format
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: settingsObj
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    // Even in case of unexpected errors, return default settings to prevent app crash
    const defaultSettings = {
      shop_name: 'LuxeCut Barber Shop',
      allow_signups: 'true',
      site_logo: 'https://picsum.photos/seed/logo/300/300'
    };
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: defaultSettings
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});