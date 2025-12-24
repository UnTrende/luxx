#!/bin/bash
# Emergency rollback script

echo "🚨 EMERGENCY ROLLBACK INITIATED"
timestamp=$(date +%Y%m%d-%H%M%S)

# 1. Turn off all feature flags
echo "Turning off feature flags..."
supabase secrets set FF_STRICT_VALIDATION=false
supabase secrets set FF_RATE_LIMITING=false
supabase secrets set FF_CACHE_ENABLED=false

# 2. Revert to last known good Edge Functions
echo "Deploying last known good functions..."
supabase functions deploy --all

# 3. Send alert (if webhook is configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 EMERGENCY ROLLBACK COMPLETED at $timestamp\"}" \
    $SLACK_WEBHOOK_URL
fi

echo "✅ Rollback completed at $timestamp"