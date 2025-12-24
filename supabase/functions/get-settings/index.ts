import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
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

    // Get settings from the correct table (settings table with columns)
    const { data: settings, error } = await supabaseClient
      .from('settings')
      .select('*')
      .eq('id', 'site_settings')
      .single();

    console.log('⚙️ Raw settings from database:', settings, 'index');
    console.log('⚙️ Database error (if any):', error, 'index');

    // If there's an error (likely table doesn't exist), return default settings
    if (error) {
      console.warn('Site settings not found, returning default settings:', error.message, 'index');
      
      const defaultSettings = {
        shop_name: 'LuxeCut Barber Shop',
        allow_signups: true,
        site_logo: 'https://picsum.photos/seed/logo/300/300',
        hero_images: []
      };
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: defaultSettings
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to match expected format
    const settingsObj: any = {
      shop_name: settings.site_name,
      allow_signups: settings.allow_signups,
      site_logo: settings.site_logo,
      hero_images: settings.hero_images || []
    };

    console.log('⚙️ Settings loaded:', settingsObj, 'index');

    // Return wrapped response to match expected format
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: settingsObj
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error, 'index');
    
    // Even in case of unexpected errors, return default settings to prevent app crash
    const defaultSettings = {
      shop_name: 'LuxeCut Barber Shop',
      allow_signups: true,
      site_logo: 'https://picsum.photos/seed/logo/300/300',
      hero_images: []
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