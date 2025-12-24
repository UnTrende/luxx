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
    const entityType = formData.get('entityType') as string; // 'product', 'barber', 'service'
    const entityId = formData.get('entityId') as string;

    if (!file || !bucket || !path) {
      return new Response(
        JSON.stringify({ error: 'File, bucket, and path are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from(bucket)
      .getPublicUrl(path);

    // Update database record if entity info provided
    if (entityType && entityId) {
      let updateData: any = {};
      let tableName = '';

      switch (entityType) {
        case 'product':
          tableName = 'products';
          updateData = {
            image_path: path,
            // Database column is 'imageurl' (lowercase, no underscore)
            imageurl: publicUrl
          };
          break;
        case 'barber':
          tableName = 'barbers';
          updateData = {
            photo_path: path,
            photo: publicUrl
          };
          break;
        case 'service':
          tableName = 'services';
          updateData = {
            image_path: path,
            image_url: publicUrl
          };
          break;
      }

      if (tableName) {
        // First try updating with URL
        const { error: updateError } = await supabaseClient
          .from(tableName)
          .update(updateData)
          .eq('id', entityId);

        if (updateError) {
          console.warn(`Failed to update ${tableName} with URL, retrying with just path...`, updateError, 'index');
          // Fallback: try updating just the path (if URL column doesn't exist)
          const fallbackData = { ...updateData };
          delete fallbackData.image_url;
          delete fallbackData.photo;

          await supabaseClient
            .from(tableName)
            .update(fallbackData)
            .eq('id', entityId);
        }
      }
    }

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
    console.error('Upload error:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});