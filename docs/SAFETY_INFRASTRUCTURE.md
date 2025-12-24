# LuxeCut Safety Infrastructure Documentation

## Overview

This document describes the safety infrastructure implemented for the LuxeCut Barber Shop application. The infrastructure provides multiple layers of protection including validation, rate limiting, monitoring, caching, and gradual rollouts.

## Components

### 1. Safety Core (`safety-core.ts`)

The safety core provides a wrapper function `withSafetyNet` that adds common safety features to all edge functions:

- CORS handling
- Request context creation
- Error handling and logging
- Feature flag integration

### 2. Validation Suite (`validation-suite.ts`)

Provides schema-based validation using a simplified Zod-like approach:

- Booking and user schema validation
- Shadow mode for testing validation rules without blocking
- Strict mode for enforcing validation in production
- Validation logging for monitoring

### 3. Rate Limiter (`rate-limiter.ts`)

Implements rate limiting to prevent abuse:

- Per-IP, per-user, and per-endpoint limits
- Configurable limits via feature flags
- Monitoring of near-limit conditions

### 4. Security Headers (`security-headers.ts`)

Adds security headers to all responses:

- Content Security Policy (CSP)
- XSS protection
- Frame protection
- Referrer policy

### 5. Cache Service (`cache-service.ts`)

Provides caching functionality to improve performance:

- In-memory caching for demonstration
- TTL-based expiration
- Tag-based invalidation
- Hit/miss monitoring

### 6. Metrics Collector (`metrics.ts`)

Collects and flushes metrics:

- Request duration and count
- Cache hit/miss rates
- Validation success/failure rates
- Automatic flushing

### 7. Alert Manager (`alerts.ts`)

Monitors system health and sends alerts:

- Critical error detection
- High error rate detection
- Database logging of alerts

### 8. Gradual Rollout Manager (`rollout-manager.ts`)

Manages feature rollouts:

- User-based percentage rollouts
- Configurable rollout speeds
- Automatic adjustment based on metrics

## Feature Flags

The system uses environment variables as feature flags:

- `FF_STRICT_VALIDATION` - Enable strict validation
- `FF_RATE_LIMITING` - Enable rate limiting
- `FF_ENHANCED_LOGGING` - Enable detailed logging
- `FF_SHADOW_MODE` - Enable shadow mode for validation
- `FF_CACHE_ENABLED` - Enable caching
- `FF_MONITORING_ENABLED` - Enable monitoring
- `ENVIRONMENT` - Current environment (development, staging, production)
- `FF_GRADUAL_ROLLOUT_PERCENT` - Percentage of users for gradual rollouts

## Usage

To use the safety infrastructure in an edge function:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withSafetyNet, SafetyContext } from '../_shared/safety-core.ts';

const handleRequest = async (req: Request, context: SafetyContext) => {
  // Your function logic here
  return new Response(JSON.stringify({ message: 'Success' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
};

serve(withSafetyNet(handleRequest));
```

## Monitoring Tables

The system creates two tables for monitoring:

1. `deployment_monitoring` - Tracks deployment phases and feature status
2. `security_logs` - Logs security events and errors

## Health Check

A health check endpoint is available at `/functions/v1/health` that verifies:

- Database connectivity
- Edge function status
- Storage connectivity
- Feature flag status

## Rollback Procedures

In case of emergency, the `scripts/emergency-rollback.sh` script can be used to:

- Disable all feature flags
- Revert to known good functions
- Send alert notifications