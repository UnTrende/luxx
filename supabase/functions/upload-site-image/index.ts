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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      return new Response(
        JSON.stringify({ error: 'File, bucket, and path are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Uploading to ${bucket}/${path}`, undefined, 'index');

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError, 'index');
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('✅ Upload successful:', publicUrl, 'index');

    return new Response(
      JSON.stringify({ 
        success: true, 
        path,
        publicUrl,
        message: 'File uploaded successfully' 
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