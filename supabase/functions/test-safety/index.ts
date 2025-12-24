import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withSafetyNet, SafetyContext } from '../_shared/safety-core.ts';
import { SafeValidator } from '../_shared/validation-suite.ts';
import { RateLimiter } from '../_shared/rate-limiter.ts';
import { withSecurityHeaders } from '../_shared/security-headers.ts';
import { MetricsCollector } from '../_shared/metrics.ts';
import { GradualRollout } from '../_shared/rollout-manager.ts';

// Create instances of our new utilities
const validator = new SafeValidator();
const rateLimiter = new RateLimiter();
const metrics = MetricsCollector.getInstance();

const handleTestRequest = async (req: Request, context: SafetyContext) => {
  const startTime = Date.now();
  
  try {
    // Test rate limiting
    const userId = context.userId || 'anonymous';
    const rateCheck = await rateLimiter.check(userId, 'user', context);
    if (!rateCheck.allowed) {
      const response = new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }), 
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return withSecurityHeaders(response);
    }
    
    // Test validation
    const testData = { email: 'test@example.com', full_name: 'Test User' };
    const validation = await validator.validate(testData, 'user', context);
    
    // Test gradual rollout
    const shouldEnableFeature = GradualRollout.shouldEnableForUser(userId, 'test-feature', 50);
    
    // Record metric
    await metrics.recordRequest('test-safety', Date.now() - startTime, 200, userId);
    
    const result = {
      message: 'Safety infrastructure test successful',
      validation: validation,
      rateLimit: rateCheck,
      featureEnabled: shouldEnableFeature,
      context: {
        requestId: context.requestId,
        timestamp: context.timestamp,
        ip: context.ip
      }
    };
    
    const response = new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
    
    return withSecurityHeaders(response);
    
  } catch (error) {
    // Record error metric
    await metrics.recordRequest('test-safety', Date.now() - startTime, 500, context.userId);
    
    const response = new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
    
    return withSecurityHeaders(response);
  }
};

serve(withSafetyNet(handleTestRequest));