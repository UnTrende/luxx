---
trigger: file_based
patterns: ["supabase/functions/**/*.ts"]
---

# Specific Files Rules - Supabase Edge Functions

This rule applies to all files in the `supabase/functions/` directory.

## Edge Function Standards

### Authentication Requirements
All Edge Functions that require authentication MUST:
1. Import and use the `authenticateUser` helper from `../_shared/auth.ts`
2. Validate CSRF tokens for all authenticated requests
3. Check user roles when role-specific access is required
4. Handle authentication errors gracefully

### Implementation Pattern
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user (required for protected functions)
    const user = await authenticateUser(req);
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Function logic here...
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Database Schema Changes
When database schema changes occur:
1. Update ALL related Edge Functions to remove references to dropped columns
2. Verify column names match exactly (case-sensitive)
3. Test functions after schema changes
4. Document breaking changes in migration files

### Security Considerations
1. NEVER expose raw database errors to clients
2. Always validate input parameters
3. Use service role keys for database access, not user tokens
4. Implement proper rate limiting for public-facing functions
5. Log security events to the `security_logs` table