import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ValidatedUser {
  id: string;
  email: string;
  role: 'admin' | 'barber' | 'customer';
  barber_id?: string | null;
}

export interface AuthError {
  error: string;
  status: number;
}

export const validateUser = async (
  req: Request,
  requiredRoles?: string[]
): Promise<ValidatedUser | AuthError> => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid Authorization header', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Validate JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    // 3. Get user profile with role from app_users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile not found in app_users, try to get role from user metadata
    let userRole = profile?.role;
    let barberUserId = null;
    
    if (profileError || !profile) {
      logger.warn('User profile not found in app_users, using metadata:', profileError?.message, 'auth-middleware');
      // Fallback to user metadata
      userRole = user.app_metadata?.role || user.user_metadata?.role || 'customer';
    }
    
    // If user is a barber, get their barber_id from barbers table
    if (userRole === 'barber') {
      const { data: barberData } = await supabaseAdmin
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      barberUserId = barberData?.id || null;
    }

    const validatedUser: ValidatedUser = {
      id: user.id,
      email: user.email!,
      role: userRole as 'admin' | 'barber' | 'customer',
      barber_id: barberUserId,
    };

    // 4. Check required roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(validatedUser.role)) {
        return { 
          error: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`, 
          status: 403 
        };
      }
    }

    return validatedUser;
  } catch (error) {
    logger.error('Auth validation error:', error, 'auth-middleware');
    return { error: 'Internal authentication error', status: 500 };
  }
};

// Rate limiting middleware
export const rateLimit = (() => {
  const store = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 60; // 60 requests per minute

  return async (key: string): Promise<{ allowed: boolean; remaining: number }> => {
    const now = Date.now();
    const userData = store.get(key);

    if (!userData || now > userData.resetTime) {
      // First request or window expired
      store.set(key, { count: 1, resetTime: now + WINDOW_MS });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (userData.count >= MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }

    userData.count++;
    return { allowed: true, remaining: MAX_REQUESTS - userData.count };
  };
})();

// CSRF validation middleware
export const validateCSRF = (req: Request): boolean => {
  try {
    const csrfToken = req.headers.get('X-CSRF-Token');
    
    // If no CSRF token is provided, fail validation
    if (!csrfToken) {
      logger.warn('CSRF validation failed: No CSRF token provided in headers', undefined, 'auth-middleware');
      return false;
    }
    
    // For now, we'll accept any non-empty CSRF token
    // In a production environment, you would validate against a session store
    return csrfToken.length > 0;
  } catch (error) {
    logger.error('CSRF validation error:', error, 'auth-middleware');
    return false;
  }
};

// Input sanitization middleware
export const sanitizeInput = <T>(input: T): T => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      // Remove script tags and malicious content
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>'"]/g, '')
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitize(v)])
      );
    }
    return value;
  };

  return sanitize(input) as T;
};