// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, description, categories, price, imageUrl:imageurl, stock')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Normalize data to ensure type consistency
    const normalizedProducts = (products || []).map(product => ({
      ...product,
      stock: Number(product.stock) || 0,
      price: Number(product.price) || 0,
      categories: Array.isArray(product.categories) ? product.categories : []
    }));

    return new Response(JSON.stringify(normalizedProducts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});