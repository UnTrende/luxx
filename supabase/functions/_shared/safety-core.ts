// Declare Deno namespace for TypeScript
declare const Deno: unknown;

import { corsHeaders } from './cors.ts';
import { getRedisClient } from './redis-client.ts';

export const enhancedCorsHeaders = {
  ...corsHeaders,
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export interface SafetyConfig {
  enableRateLimit: boolean;
  enableValidation: boolean;
  enableMonitoring: boolean;
  enableCaching: boolean;
}

export interface SafetyContext {
  requestId: string;
  timestamp: string;
  ip: string;
  userId?: string;
  config: SafetyConfig;
}

// Extract user ID from request
export function extractUserId(req: Request): string | undefined {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return undefined;

    // This is a simplified extraction - in reality, you'd decode the JWT
    // For now, we'll just return a placeholder
    return 'user-id-placeholder';
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return undefined;
  }
}

// Log request for monitoring
export async function logRequest(req: Request, context: SafetyContext): Promise<void> {
  if (!context.config.enableMonitoring) return;

  console.log(`REQUEST ${context.requestId}: ${req.method} ${req.url} from ${context.ip}`);

  // In a real implementation, this would log to the security_logs table
  // For now, we'll just log to console
}

// Enhanced error handling
export async function handleError(error: Error | unknown, req: Request, context: SafetyContext): Promise<Response> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Log error if monitoring is enabled
  if (context.config.enableMonitoring) {
    console.error(`ERROR ${context.requestId}: ${errorMessage}`);

    // In a real implementation, this would log to the security_logs table
  }

  // Return appropriate error response
  return new Response(
    JSON.stringify({
      error: 'An error occurred processing your request',
      requestId: context.requestId
    }),
    {
      status: 500,
      headers: enhancedCorsHeaders
    }
  );
}

export function withSafetyNet(
  handler: (req: Request, context: SafetyContext) => Promise<Response>,
  config: Partial<SafetyConfig> = {}
) {
  return async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: enhancedCorsHeaders });
    }

    // Try to warm up Redis connection early
    getRedisClient();

    // Create safety context
    const context: SafetyContext = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userId: extractUserId(req),
      config: {
        enableRateLimit: (Deno && Deno.env.get('FF_RATE_LIMITING') === 'true') || config.enableRateLimit || false,
        enableValidation: (Deno && Deno.env.get('FF_STRICT_VALIDATION') === 'true') || config.enableValidation || false,
        enableMonitoring: (Deno && Deno.env.get('FF_ENHANCED_LOGGING') === 'true') || config.enableMonitoring || false,
        enableCaching: (Deno && Deno.env.get('FF_CACHE_ENABLED') === 'true') || config.enableCaching || false,
      }
    };
    try {
      // Log request
      if (context.config.enableMonitoring) {
        await logRequest(req, context);
      }

      return await handler(req, context);
    } catch (error) {
      // Enhanced error handling
      return await handleError(error, req, context);
    }
  };
}