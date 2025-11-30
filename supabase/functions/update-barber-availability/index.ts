// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { hiddenSlots } = await req.json(); // Array of time strings
    
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: barberUser }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!barberUser || barberUser.app_metadata.role !== 'barber') {
        throw new Error("Unauthorized: Barber access required.");
    }
    // Resolve the barber_id from the authenticated user's id
    const { data: barberRow, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id')
      .eq('user_id', barberUser.id)
      .single();
    if (barberError || !barberRow) {
      throw new Error('Barber profile not found for user.');
    }

    // Upsert hidden hours into barber_settings
    const { error: upsertError } = await supabaseAdmin
      .from('barber_settings')
      .upsert({
        barber_id: barberRow.id,
        hidden_hours: hiddenSlots,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'barber_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), {
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