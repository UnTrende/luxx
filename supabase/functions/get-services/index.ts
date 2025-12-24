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
    
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('id, name, duration, price, category, image_url, image_path, storage_bucket, loyalty_points')
      .eq('active', true); // Only fetch active services

    if (error) throw error;

    // Normalize data
    const normalizedServices = (services || []).map(service => ({
      ...service,
      price: Number(service.price) || 0,
      duration: Number(service.duration) || 0,
      loyalty_points: Number(service.loyalty_points_bronze || service.loyalty_points_silver || service.loyalty_points_gold || 0) || 0
    }));

    return successResponse(normalizedServices, 200);
  } catch (error) {
    console.error('Error fetching services:', error, 'index');
    return handleError(error, 'get-services');
  }
});