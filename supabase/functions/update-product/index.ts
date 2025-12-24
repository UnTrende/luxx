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

    const { productId, name, price, description, imageUrl, image_path, categories, stock } = await req.json();

    // Validate required fields
    if (!productId || !name || !price) {
      return new Response(
        JSON.stringify({ error: 'Product ID, name, and price are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OPTION 1: Try with different column name variations
    let updateData: any = {
      name: name.toString(),
      price: parseFloat(price),
      description: description?.toString() || '',
      categories: categories || [],
      stock: stock ? parseInt(stock) : 0
    };

    // Use correct database column name: 'imageurl' (lowercase, no underscore)
    if (imageUrl) {
      updateData.imageurl = imageUrl; // Database uses lowercase
    }

    // Add image_path if provided
    if (image_path) {
      updateData.image_path = image_path;
    }

    console.log('Updating data:', updateData, 'index');

    const { data, error } = await supabaseClient
      .from('products')
      .update([updateData])
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Update error:', error, 'index');

      // OPTION 2: If update fails, try without imageUrl
      if (error.message.includes('imageUrl')) {
        console.log('Retrying without imageUrl...', undefined, 'index');
        delete updateData.imageUrl;
        // delete updateData.image_url;
        // delete updateData.imageurl;

        const { data: retryData, error: retryError } = await supabaseClient
          .from('products')
          .update([updateData])
          .eq('id', productId)
          .select();

        if (retryError) {
          throw retryError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: retryData,
            warning: 'Product updated without image due to schema issues'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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