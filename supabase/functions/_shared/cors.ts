// These are the CORS headers that will be used in our Deno Edge Functions.
// They are necessary to allow the frontend application (running on a different origin)
// to make requests to our backend functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
