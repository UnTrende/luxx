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

export async function authenticateAdmin(request: Request): Promise<AuthenticatedUser> {
  return authenticateUser(request, 'admin');
}

export async function authenticateBarber(request: Request): Promise<AuthenticatedUser> {
  return authenticateUser(request, 'barber');
}