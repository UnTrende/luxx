// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { successResponse, handleError } from '../_shared/response.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    console.log("Fetching barbers from database...", undefined, 'index');
    
    const { data: barbers, error } = await supabaseAdmin
      .from('barbers')
      .select(`
        *,
        reviews:reviews(*),
        barber_services:barber_services(*)
      `)
      .eq('active', true);
      
    console.log("Barbers fetched:", barbers?.length || 0, 'index');

    if (error) {
      console.error("Error fetching barbers:", error, 'index');
      throw error;
    }

    // Transform the data to include services array in the format expected by the frontend
    const barbersWithServices = barbers.map(barber => ({
      ...barber,
      services: barber.barber_services || []
    }));

    return successResponse(barbersWithServices, 200);
  } catch (error) {
    console.error("Error in get-barbers function:", error, 'index');
    return handleError(error, "get-barbers");
  }
});