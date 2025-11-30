// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This is the Supabase client for use INSIDE our Deno Edge Functions.
// It is initialized with the service_role key, which allows it to bypass
// Row Level Security (RLS) policies. This is crucial for backend operations
// where we need to perform administrative tasks or queries that a normal
// user would not be allowed to do directly.

// The Deno environment on Supabase provides these environment variables automatically.
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);