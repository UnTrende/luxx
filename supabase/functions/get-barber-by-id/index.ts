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
    const { id } = await req.json();
    if (!id) {
        throw new Error("Barber ID is required.");
    }
    
    const { data: barber, error } = await supabaseAdmin
      .from('barbers')
      .select(`
        *,
        reviews:reviews(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!barber) {
        return new Response(JSON.stringify({ error: "Barber not found" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    return new Response(JSON.stringify(barber), {
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