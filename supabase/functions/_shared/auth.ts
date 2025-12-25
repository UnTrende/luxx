// Authentication helper for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

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

export function validateCSRF(request: Request) {
  // Enhanced CSRF validation using double-submit pattern
  const headerToken = request.headers.get('X-CSRF-Token');
  const cookieHeader = request.headers.get('Cookie');
  
  if (!headerToken || headerToken.length < 30) {
    console.error('CSRF Validation Failed: Missing or invalid X-CSRF-Token header');
    throw new Error('CSRF Validation Failed: Missing header token');
  }
  
  // Extract CSRF token from cookies
  let cookieToken: string | null = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        cookieToken = value;
        break;
      }
    }
  }
  
  if (!cookieToken) {
    console.error('CSRF Validation Failed: Missing csrf-token cookie');
    throw new Error('CSRF Validation Failed: Missing cookie token');
  }
  
  // Validate tokens match (double-submit pattern)
  if (headerToken !== cookieToken) {
    console.error('CSRF Validation Failed: Header and cookie tokens do not match', {
      headerPrefix: headerToken.substring(0, 8),
      cookiePrefix: cookieToken.substring(0, 8)
    });
    throw new Error('CSRF Validation Failed: Token mismatch');
  }
  
  console.log('CSRF validation successful', { 
    tokenPrefix: headerToken.substring(0, 8) 
  });
}


export async function authenticateAdmin(request: Request): Promise<AuthenticatedUser> {
  return authenticateUser(request, 'admin');
}

export async function authenticateBarber(request: Request): Promise<AuthenticatedUser> {
  return authenticateUser(request, 'barber');
}

// validateAuth - accepts Supabase client and array of allowed roles
export async function validateAuth(supabase: any, allowedRoles: string[] = []): Promise<AuthenticatedUser | null> {
  try {
    // Get the user from the Supabase client
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      return null;
    }
    if (!user) {
      console.error('No user found');
      return null;
    }

    // Get user role from app_users table
    const { data: userData, error: dbError } = await supabase
      .from('app_users')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Database error fetching user:', dbError);
      return null;
    }

    const userRole = userData?.role || user.app_metadata?.role || 'customer';

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      console.error(`User role ${userRole} not in allowed roles:`, allowedRoles);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: userRole,
      name: userData?.name || user.user_metadata?.name || 'Unknown User'
    };
  } catch (error: Error | unknown) {
    console.error('validateAuth error:', error);
    return null;
  }
}