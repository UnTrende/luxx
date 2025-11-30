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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shopName, allowSignups, siteLogo, heroImages } = await req.json();

    console.log('⚙️ Updating site settings:', { shopName, allowSignups });

    // Update shop name if provided
    if (shopName !== undefined) {
      const { error: nameError } = await supabaseClient
        .from('site_settings')
        .upsert({ 
          key: 'shop_name', 
          value: shopName,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });

      if (nameError) throw nameError;
    }

    // Update allow signups if provided
    if (allowSignups !== undefined) {
      const { error: signupError } = await supabaseClient
        .from('site_settings')
        .upsert({ 
          key: 'allow_signups', 
          value: allowSignups,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });

      if (signupError) throw signupError;
    }

    // Store site logo and hero images in settings
    if (siteLogo !== undefined) {
      const { error: logoError } = await supabaseClient
        .from('site_settings')
        .upsert({ 
          key: 'site_logo', 
          value: siteLogo,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });

      if (logoError) throw logoError;
    }

    if (heroImages !== undefined) {
      const { error: heroError } = await supabaseClient
        .from('site_settings')
        .upsert({ 
          key: 'hero_images', 
          value: heroImages,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });

      if (heroError) throw heroError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Settings updated successfully in database'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});