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

    const { name, price, description, imageUrl, image_path, categories, stock } = await req.json();

    // Validate required fields
    if (!name || !price) {
      return new Response(
        JSON.stringify({ error: 'Name and price are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only use columns that exist in the database: name, price, description, categories, stock, imageurl, image_path
    let insertData: any = {
      name: name.toString(),
      price: parseFloat(price),
      description: description?.toString() || '',
      categories: categories || [],
      stock: stock ? parseInt(stock) : 0
    };

    // Use correct database column name: 'imageurl' (lowercase, no underscore)
    if (imageUrl) {
      insertData.imageurl = imageUrl;
    }

    // Add image_path if provided
    if (image_path) {
      insertData.image_path = image_path;
    }

    console.log('Inserting data:', insertData, 'index');

    const { data, error } = await supabaseClient
      .from('products')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Insert error:', error, 'index');

      // OPTION 2: If insert fails, try without imageUrl
      if (error.message.includes('imageUrl')) {
        console.log('Retrying without imageUrl...', undefined, 'index');
        delete insertData.imageUrl;
        // delete insertData.image_url;
        // delete insertData.imageurl;

        const { data: retryData, error: retryError } = await supabaseClient
          .from('products')
          .insert([insertData])
          .select();

        if (retryError) {
          throw retryError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: retryData,
            warning: 'Product saved without image due to schema issues'
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