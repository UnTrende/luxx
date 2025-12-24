import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateAdmin } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(req);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shopName, allowSignups, siteLogo, heroImages } = await req.json();

    console.log('⚙️ Updating site settings:', { shopName, allowSignups, siteLogo, heroImages }, 'index');

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (shopName !== undefined) {
      updateData.site_name = shopName;
    }

    if (allowSignups !== undefined) {
      updateData.allow_signups = allowSignups;
    }

    if (siteLogo !== undefined) {
      updateData.site_logo = siteLogo;
    }

    if (heroImages !== undefined) {
      updateData.hero_images = heroImages;
    }

    console.log('⚙️ Update data prepared:', updateData, 'index');

    // Update settings in the correct table (settings table with columns)
    const { data, error: updateError } = await supabaseClient
      .from('settings')
      .update(updateData)
      .eq('id', 'site_settings')
      .select();

    console.log('⚙️ Update result:', { data, error: updateError }, 'index');

    if (updateError) {
      console.error('⚙️ Update error:', updateError, 'index');
      throw updateError;
    }

    // Verify the update by fetching the data back
    const { data: verifyData, error: verifyError } = await supabaseClient
      .from('settings')
      .select('hero_images')
      .eq('id', 'site_settings')
      .single();

    console.log('⚙️ Verification data:', { verifyData, verifyError }, 'index');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Settings updated successfully in database',
        verification: { data: verifyData, error: verifyError }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});