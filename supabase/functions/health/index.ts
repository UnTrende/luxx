// Declare Deno for TypeScript
declare const Deno: unknown;

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';

serve(async (req) => {
  const checks: Record<string, any> = {};
  const startTime = Date.now();
  
  // 1. Database connectivity
  try {
    const start = Date.now();
    await supabaseAdmin.from('bookings').select('count').limit(1);
    checks.database = {
      status: 'healthy',
      latency: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  // 2. Edge Function connectivity
  checks.edge_functions = {
    status: 'healthy',
    region: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('REGION') || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  // 3. Storage connectivity
  try {
    const start = Date.now();
    await supabaseAdmin.storage.listBuckets();
    checks.storage = {
      status: 'healthy',
      latency: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    checks.storage = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  // 4. Feature flags status
  checks.feature_flags = {
    strict_validation: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('FF_STRICT_VALIDATION') === 'true',
    rate_limiting: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('FF_RATE_LIMITING') === 'true',
    caching: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('FF_CACHE_ENABLED') === 'true',
    timestamp: new Date().toISOString()
  };
  
  const isHealthy = Object.values(checks)
    .every(check => check.status === 'healthy' || check.status === undefined);
  
  const totalLatency = Date.now() - startTime;
  
  return new Response(
    JSON.stringify({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latency: totalLatency,
      version: '1.0.0',
      environment: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('ENVIRONMENT') || 'development',
      checks
    }, null, 2),
    { 
      status: isHealthy ? 200 : 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
});