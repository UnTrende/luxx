import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { validateAuth } from '../_shared/auth.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Validate authentication (admins only)
    const user = await validateAuth(req, ['admin']);
    if (!user) {
      return createErrorResponse('Unauthorized: Admin access required', 401);
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return createErrorResponse(`Failed to fetch transactions: ${error.message}`, 500);
    }

    return createSuccessResponse(transactions);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Internal server error: ${error.message}`, 500);
  }
});
