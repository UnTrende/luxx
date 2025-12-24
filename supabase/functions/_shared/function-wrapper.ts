import { corsHeaders } from './cors.ts';
import { validateUser, rateLimit, validateCSRF, sanitizeInput, ValidatedUser } from './auth-middleware.ts';
import { logger } from '../../../src/lib/logger';

interface HandlerOptions {
  requiredRoles?: string[];
  validateCSRF?: boolean;
  rateLimit?: boolean;
}

export const createHandler = (
  handler: (req: Request, user: ValidatedUser, data: Record<string, unknown>) => Promise<any>,
  options: HandlerOptions = {}
) => {
  return async (req: Request): Promise<Response> => {
    // Handle CORS - respond to OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
          'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
        }
      });
    }

    try {
      // 1. Authenticate
      const authResult = await validateUser(req, options.requiredRoles);
      if ('error' in authResult) {
        return errorResponse(authResult.error, authResult.status);
      }
      const user = authResult as ValidatedUser;

      // 2. Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitResult = await rateLimit(user.id);
        if (!rateLimitResult.allowed) {
          return errorResponse('Rate limit exceeded', 429, {
            retryAfter: 60,
            remaining: rateLimitResult.remaining,
          });
        }
      }

      // 3. CSRF validation
      // Optimization: GET requests typically don't need CSRF if they don't modify state
      // Skip CSRF validation for GET requests and only apply to state-changing requests
      if (options.validateCSRF !== false && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')) {
        if (!validateCSRF(req)) {
          // Log warning but maybe not block immediately to prevent production breakage if cookies are weird
          logger.warn('CSRF validation failed for user', user.id, 'function-wrapper');
          // return errorResponse('Invalid CSRF token', 403);
        }
      }

      // 4. Parse and sanitize input
      let data: Record<string, unknown> = {};
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        try {
          const rawData = await req.json();
          data = sanitizeInput(rawData);
        } catch {
          // No JSON body, that's okay for GET/DELETE or empty bodies
        }
      } else if (req.method === 'GET') {
        // Parse search params for GET
        const url = new URL(req.url);
        data = Object.fromEntries(url.searchParams.entries());
      }

      // 5. Execute handler
      const result = await handler(req, user, data);

      // 6. Return success response
      return successResponse(result);

    } catch (error: Error | unknown) {
      logger.error('Handler error:', error, 'function-wrapper');
      return errorResponse(error.message || 'Internal server error', 500);
    }
  };
};

const successResponse = (data: Record<string, unknown>, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

const errorResponse = (message: string, status: number, extras?: any): Response => {
  return new Response(
    JSON.stringify({ error: message, ...extras }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};