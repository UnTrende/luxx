import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { corsHeaders as sharedCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...sharedCorsHeaders, ...corsHeaders } });
  }

  try {
    const { barberId, services } = await req.json();
    console.log('Updating services for barber:', barberId, services);

    // Validate input
    if (!barberId) {
      return new Response(
        JSON.stringify({ error: 'Barber ID is required' }),
        { status: 400, headers: { ...sharedCorsHeaders, ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test if barbers table is accessible
    const { error: testError } = await supabaseAdmin
      .from('barbers')
      .select('id')
      .eq('id', barberId)
      .single();

    if (testError) {
      console.error('Barber access error:', testError);
      throw testError;
    }

    // Delete existing barber services
    const { error: deleteError } = await supabaseAdmin
      .from('barber_services')
      .delete()
      .eq('barber_id', barberId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    // Insert new services if provided
    if (services && services.length > 0) {
      const barberServices = services.map((service: any) => ({
        barber_id: barberId,
        service_id: service.serviceId,
        price: service.price
      }));

      const { error: insertError } = await supabaseAdmin
        .from('barber_services')
        .insert(barberServices);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }

    // Get updated barber with services
    const { data: updatedBarber, error: selectError } = await supabaseAdmin
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single();

    if (selectError) {
      console.error('Select error:', selectError);
      throw selectError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedBarber,
        message: 'Barber services updated successfully' 
      }),
      { status: 200, headers: { ...sharedCorsHeaders, ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...sharedCorsHeaders, ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});