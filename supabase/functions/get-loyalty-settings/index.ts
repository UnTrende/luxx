import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateUser } from '../_shared/auth.ts';

interface LoyaltySettings {
  id: string;
  service_rate_silver: number;
  service_rate_gold: number;
  service_rate_platinum: number;
  silver_threshold: number;
  gold_threshold: number;
  platinum_threshold: number;
  late_cancellation_penalty: number;
  no_show_penalty: number;
  created_at?: string;
  updated_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user (loyalty settings can be viewed by authenticated users)
    await authenticateUser(req);

    // Get loyalty settings from database
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('loyalty_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (settingsError) {
      console.error('Error fetching loyalty settings:', settingsError, 'index');
      
      // If settings don't exist, return default values
      if (settingsError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            success: true,
            settings: {
              id: 'default',
              service_rate_silver: 5.00,
              service_rate_gold: 10.00,
              service_rate_platinum: 15.00,
              silver_threshold: 100,
              gold_threshold: 200,
              platinum_threshold: 9999,
              late_cancellation_penalty: 500,
              no_show_penalty: 1000,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch loyalty settings',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return settings
    return new Response(
      JSON.stringify({
        success: true,
        settings: settings as LoyaltySettings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-loyalty-settings:', error, 'index');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
