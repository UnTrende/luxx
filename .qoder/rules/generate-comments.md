---
trigger: model_decision
description: "Generate code comments following project standards"
---

# Model Decision Rule - Generate Code Comments

When asked to generate or improve code comments, follow these guidelines:

## Documentation Rules
1. COMPREHENSIVE COVERAGE - Complex logic MUST be documented with inline comments
2. CLEAR EXPLANATIONS - Comments should explain WHY something is done, not just WHAT is done
3. FUNCTION DESCRIPTIONS - All functions should have clear descriptions of parameters and return values
4. MAINTAINABILITY - Comments should help future developers understand and maintain the code

## Comment Structure
```typescript
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of the parameter
 * @returns Description of what the function returns
 * 
 * @example
 * ```typescript
 * const result = functionName(paramValue);
 * ```
 * 
 * @remarks
 * Additional notes about usage, edge cases, or important implementation details
 */
```

## Example Implementation
```typescript
/**
 * Authenticates a user request and validates CSRF protection
 * 
 * This function handles user authentication for Edge Functions by:
 * 1. Verifying the Authorization header contains a valid JWT token
 * 2. Validating CSRF protection through header token verification
 * 3. Extracting user information and role from the authenticated session
 * 
 * @param request - The incoming HTTP request containing auth headers
 * @param requiredRole - Optional role that the user must have (e.g., 'admin', 'barber')
 * @returns Promise resolving to authenticated user information
 * @throws Error if authentication fails or user lacks required role
 * 
 * @example
 * ```typescript
 * const user = await authenticateUser(request, 'admin');
 * console.log(`Authenticated user: ${user.name} (${user.role})`);
 * ```
 * 
 * @remarks
 * Security considerations:
 * - CSRF validation is required for all authenticated endpoints
 * - User roles are checked against app_metadata in Supabase
 * - Authentication errors are logged but generic messages are returned to clients
 * 
 * @see {@link validateCSRF} for CSRF validation implementation
 * @see {@link authenticateAdmin} for admin-specific authentication
 * @see {@link authenticateBarber} for barber-specific authentication
 */
export async function authenticateUser(request: Request, requiredRole?: string): Promise<AuthenticatedUser> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Validate CSRF Token
    validateCSRF(request);

    // Create a Supabase client with the user's auth token
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found.");

    // Create the authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email!,
      role: user.app_metadata?.role || 'customer',
      name: user.user_metadata?.name || 'Unknown User'
    };

    // Check role if required
    if (requiredRole && authenticatedUser.role !== requiredRole) {
      throw new Error(`Unauthorized: ${requiredRole} role required`);
    }

    return authenticatedUser;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
```

## File-Level Documentation
Each file should begin with a comment block describing its purpose:
```typescript
/**
 * Authentication helper for Edge Functions
 * 
 * This module provides authentication utilities for Supabase Edge Functions,
 * including CSRF protection, role validation, and user information extraction.
 * 
 * Key features:
 * - JWT token validation
 * - CSRF double-submit cookie protection
 * - Role-based access control
 * - User profile extraction
 * 
 * @module auth
 * @author LuxeCut Development Team
 * @since 2025
 */
```