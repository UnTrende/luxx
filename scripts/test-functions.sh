#!/bin/bash

# Test script for deployed functions with authentication and CSRF protection
echo "Testing deployed functions with authentication and CSRF protection..."

# Use the provided project details
PROJECT_URL="https://sdxfgugmdrmdjwhagjfa.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjkyMzgsImV4cCI6MjA3NjkwNTIzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w"
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IlFadHViZmR6QVZFdHQ2N3YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NkeGZndWdtZHJtZGp3aGFnamZhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlN2NkYjcxMi1hNmY0LTQ5M2EtYmU4NC04OTBhNDlkOWY0M2MiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MTQ5ODQ3LCJpYXQiOjE3NjUxNDYyNDcsImVtYWlsIjoiYWRtaW4ud2FxYXNAY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdLCJyb2xlIjoiYWRtaW4ifSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluLndhcWFzQGNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoid2FxYXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJhZG1pbiIsInN1YiI6ImU3Y2RiNzEyLWE2ZjQtNDkzYS1iZTg0LTg5MGE0OWQ5ZjQzYyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY1MDYxMDIyfV0sInNlc3Npb25faWQiOiI3NzM3YjYwNi02MDdlLTQyMTYtOWJkYi1lYWExZjU0NWIzMTciLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.7w6zJck6tZCI_xPVenWTeZ07ZhQkXarmclBOH3XEhPg"

# First, let's get a CSRF token by calling the generate-csrf-token function
echo "Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -X POST "${PROJECT_URL}/functions/v1/generate-csrf-token" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "CSRF Response: $CSRF_RESPONSE"

# Extract CSRF token from response (assuming it's in a csrfToken field)
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')

if [ -z "$CSRF_TOKEN" ]; then
    echo "Failed to extract CSRF token from response"
    echo "Response was: $CSRF_RESPONSE"
    exit 1
fi

echo "Got CSRF token: $CSRF_TOKEN"

echo "Testing health check function with authentication..."
curl -X GET "${PROJECT_URL}/functions/v1/health" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"

echo -e "\n\nTesting test-safety function with authentication..."
curl -X POST "${PROJECT_URL}/functions/v1/test-safety" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\nTesting export-data function with authentication and CSRF token..."
curl -X POST "${PROJECT_URL}/functions/v1/export-data" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"entity": "bookings", "format": "csv"}'

echo -e "\n\nTest completed. Please check the responses above."