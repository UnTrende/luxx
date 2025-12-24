#!/bin/bash

# Simple health check script that doesn't rely on expired tokens
echo "🛡️  Checking App Health (Public Endpoint)..."
echo "========================================"

# Check app health status (this endpoint doesn't require auth)
curl -s -X GET "https://sdxfgugmdrmdjwhagjfa.supabase.co/functions/v1/health" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjkyMzgsImV4cCI6MjA3NjkwNTIzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "📝 Note: For full security monitoring, you need a fresh auth token."
echo "         The previous token has expired, which is normal for security."