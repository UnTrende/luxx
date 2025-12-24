// These are the CORS headers that will be used in our Deno Edge Functions.
// They are necessary to allow the frontend application (running on a different origin)
// to make requests to our backend functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

// Handle OPTIONS (preflight) requests
export function handleCors(req: Request): Response {
  return new Response('ok', { headers: corsHeaders });
}

// Create error response with CORS headers
export function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Create success response with CORS headers
export function createSuccessResponse(data: Record<string, unknown>, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
