// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { successResponse, handleError } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, description, categories, price, imageUrl:imageurl, image_path, storage_bucket, stock')
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

    return successResponse(normalizedProducts, 200);
  } catch (error) {
    console.error('Error fetching products:', error, 'index');
    return handleError(error, 'get-products');
  }
});