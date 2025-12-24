#!/bin/bash

# Full Deployment Script for Safety Infrastructure
# This script enables all safety features at once for immediate full deployment

echo "🚀 Starting full deployment of safety infrastructure..."

# Enable all safety features
echo "🔧 Setting all feature flags to production values..."
supabase secrets set \
  FF_STRICT_VALIDATION=true \
  FF_RATE_LIMITING=true \
  FF_ENHANCED_LOGGING=true \
  FF_SHADOW_MODE=false \
  FF_CACHE_ENABLED=true \
  FF_MONITORING_ENABLED=true \
  ENVIRONMENT=production \
  FF_GRADUAL_ROLLOUT_PERCENT=100

echo "✅ All feature flags have been set to production values:"
echo "   - FF_STRICT_VALIDATION=true     (Active validation blocking)"
echo "   - FF_RATE_LIMITING=true        (Rate limiting enabled)"
echo "   - FF_ENHANCED_LOGGING=true     (Logging enabled)"
echo "   - FF_SHADOW_MODE=false         (Blocking mode, not shadow)"
echo "   - FF_CACHE_ENABLED=true        (Caching enabled)"
echo "   - FF_MONITORING_ENABLED=true   (Monitoring enabled)"
echo "   - ENVIRONMENT=production      (Production environment)"
echo "   - FF_GRADUAL_ROLLOUT_PERCENT=100 (100% of users)"

echo ""
echo "📊 Verifying feature flag settings..."
supabase secrets list | grep "FF_\|ENVIRONMENT"

echo ""
echo "✅ Full deployment completed!"
echo ""
echo "⚠️  IMPORTANT: Monitor the system closely after this deployment:"
echo "   - Check the deployment_monitoring table for any issues"
echo "   - Review security_logs for blocked requests"
echo "   - Watch metrics for performance impacts"
echo "   - Be prepared to rollback if issues arise"

echo ""
echo "🔄 To rollback to staging configuration, run:"
echo "supabase secrets set \\"
echo "  FF_STRICT_VALIDATION=false \\"
echo "  FF_RATE_LIMITING=false \\"
echo "  FF_SHADOW_MODE=true \\"
echo "  FF_CACHE_ENABLED=false \\"
echo "  FF_MONITORING_ENABLED=false \\"
echo "  ENVIRONMENT=staging \\"
echo "  FF_GRADUAL_ROLLOUT_PERCENT=0"