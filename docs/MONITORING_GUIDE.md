# System Monitoring Guide

This guide explains how to check if your security measures are detecting threats and monitoring your application's health.

## Quick Health Check

Run this simple command to check your app's health:

```bash
curl -X GET "https://sdxfgugmdrmdjwhagjfa.supabase.co/functions/v1/health" \
  -H "apikey: YOUR_ANON_KEY"
```

You should see a response like:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T22:32:49.559Z",
  "latency": 849,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {"status": "healthy"},
    "edge_functions": {"status": "healthy"},
    "storage": {"status": "healthy"},
    "feature_flags": {"strict_validation": true, "rate_limiting": true}
  }
}
```

## Checking Security Events

Your system automatically logs security events. Look for these types of events:

1. **Blocked Requests** - Invalid data that was rejected
2. **Rate Limit Violations** - Users hitting request limits
3. **CSRF Failures** - Suspicious requests without proper tokens
4. **Validation Failures** - Data that didn't match expected formats

## Using the Monitoring Script

We've created a simple script to check everything at once:

```bash
# Make sure you're in the project directory
cd /Users/apple/Desktop/luxecut-barber-shop-2

# Run the monitoring script
bash scripts/check-security-logs.sh
```

This will show you:
- Recent security events
- Current app health status
- Deployment monitoring information

## What to Look For

### Healthy System Signs:
- Health status shows "healthy"
- Low number of security events
- No critical errors in deployment monitoring

### Warning Signs:
- Health status shows "degraded"
- Many blocked requests in security logs
- High error rates in deployment monitoring
- Rate limit violations

## Common Security Events You Might See

1. **Input Validation Failures** - Someone tried to send bad data
2. **Rate Limit Violations** - A user or bot is making too many requests
3. **CSRF Protection Triggers** - Suspicious requests without proper tokens
4. **Suspicious IP Addresses** - Requests from known problematic sources

## What Happens When Threats Are Detected

1. **Bad Data** - Automatically blocked, logged, and counted
2. **Too Many Requests** - User temporarily blocked, logged, and counted
3. **Security Violations** - Request blocked, security team alerted
4. **System Issues** - Automatic alerts sent to administrators

## Regular Monitoring Schedule

- **Daily**: Quick health check
- **Weekly**: Review security logs for patterns
- **Monthly**: Analyze trends and adjust security settings

## Emergency Actions

If you see serious issues:

1. **Immediate**: Run the health check script
2. **Investigate**: Look at recent security logs
3. **Contain**: Temporarily reduce feature flags if needed
4. **Document**: Record what happened and how you fixed it

## Questions to Ask Yourself

1. Is the overall health status green?
2. Are there unusual spikes in security events?
3. Are legitimate users being blocked by mistake?
4. Are response times acceptable?

If you answer "no" to any of these questions, investigate further using the monitoring tools.