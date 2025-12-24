---
trigger: model_decision
description: "Enforce security and authentication standards"
---

# Security and Authentication Rules

## Critical Security Principles
1. NEVER DISABLE AUTHENTICATION - All fixes MUST retain or strengthen authentication checks. Making functions public to bypass errors is strictly prohibited.
2. CSRF TOKEN REQUIREMENT - Every authenticated API call MUST include the X-CSRF-Token header. Functions that require authentication MUST validate CSRF tokens.
3. ROLE VALIDATION - Role-specific functions MUST verify user roles before processing. Unauthorized access attempts MUST be logged.
4. SESSION MANAGEMENT - Authentication tokens MUST be properly validated and refreshed. Expired sessions MUST redirect to login.

## Authentication & Security Model
- Role-Based Access Control:
  - `customer` - Basic access, booking, purchasing
  - `barber` - Schedule management, attendance
  - `admin` - Full system access

- CSRF Protection:
  - Double-submit cookie pattern
  - Token generation via `generate-csrf-token` function
  - Validation in `authenticateUser` helper

- API Security:
  - All authenticated endpoints require CSRF token
  - Rate limiting per IP/user/endpoint
  - Input validation with shadow mode testing

## Implementation Examples

### Correct way to make authenticated API calls:
```typescript
// Ensure CSRF Token is present
if (!csrfToken) {
  await fetchCSRFToken();
}

const response = await fetch(`${supabaseUrl}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  },
  body: JSON.stringify(data)
});
```

### Correct Edge Function authentication:
```typescript
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    // Process request only after successful authentication
    // ... rest of function logic
  } catch (error) {
    // Handle authentication errors properly
    return new Response(
      JSON.stringify({ error: `Authentication failed: ${error.message}` }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Common Security Mistakes to Avoid
1. Making authenticated functions public to fix CSRF errors
2. Removing authentication checks to "simplify" debugging
3. Hardcoding authentication tokens or secrets
4. Skipping CSRF token validation in API calls
5. Not validating user roles for role-specific operations