#!/bin/bash

# Simple script to check security logs and app health
echo "🛡️  Checking Security Events..."
echo "=========================="

# Check recent security logs (last 5 events)
echo "Recent Security Events:"
echo "--------------------"
curl -s -X GET "https://sdxfgugmdrmdjwhagjfa.supabase.co/rest/v1/security_logs?select=*&order=created_at.desc&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjkyMzgsImV4cCI6MjA3NjkwNTIzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlFadHViZmR6QVZFdHQ2N3YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NkeGZndWdtZHJtZGp3aGFnamZhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlN2NkYjcxMi1hNmY0LTQ5M2EtYmU4NC04OTBhNDlkOWY0M2MiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MTQ5ODQ3LCJpYXQiOjE3NjUxNDYyNDcsImVtYWlsIjoiYWRtaW4ud2FxYXNAY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdLCJyb2xlIjoiYWRtaW4ifSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluLndhcWFzQGNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoid2FxYXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJhZG1pbiIsInN1YiI6ImU3Y2RiNzEyLWE2ZjQtNDkzYS1iZTg0LTg5MGE0OWQ5ZjQzYyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY1MDYxMDIyfV0sInNlc3Npb25faWQiOiI3NzM3YjYwNi02MDdlLTQyMTYtOWJkYi1lYWExZjU0NWIzMTciLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.7w6zJck6tZCI_xPVenWTeZ07ZhQkXarmclBOH3XEhPg" \
  -H "Content-Type: application/json"

echo ""
echo "📈 Checking App Health..."
echo "====================="

# Check app health status
echo "App Health Status:"
echo "---------------"
curl -s -X GET "https://sdxfgugmdrmdjwhagjfa.supabase.co/functions/v1/health" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjkyMzgsImV4cCI6MjA3NjkwNTIzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlFadHViZmR6QVZFdHQ2N3YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NkeGZndWdtZHJtZGp3aGFnamZhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlN2NkYjcxMi1hNmY0LTQ5M2EtYmU4NC04OTBhNDlkOWY0M2MiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MTQ5ODQ3LCJpYXQiOjE3NjUxNDYyNDcsImVtYWlsIjoiYWRtaW4ud2FxYXNAY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdLCJyb2xlIjoiYWRtaW4ifSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluLndhcWFzQGNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoid2FxYXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJhZG1pbiIsInN1YiI6ImU3Y2RiNzEyLWE2ZjQtNDkzYS1iZTg0LTg5MGE0OWQ5ZjQzYyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY1MDYxMDIyfV0sInNlc3Npb25faWQiOiI3NzM3YjYwNi02MDdlLTQyMTYtOWJkYi1lYWExZjU0NWIzMTciLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.7w6zJck6tZCI_xPVenWTeZ07ZhQkXarmclBOH3XEhPg" \
  -H "Content-Type: application/json"

echo ""
echo "📊 Checking Deployment Monitoring..."
echo "=============================="

# Check deployment monitoring (last 5 entries)
echo "Recent Deployment Status:"
echo "---------------------"
curl -s -X GET "https://sdxfgugmdrmdjwhagjfa.supabase.co/rest/v1/deployment_monitoring?select=*&order=created_at.desc&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjkyMzgsImV4cCI6MjA3NjkwNTIzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlFadHViZmR6QVZFdHQ2N3YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NkeGZndWdtZHJtZGp3aGFnamZhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlN2NkYjcxMi1hNmY0LTQ5M2EtYmU4NC04OTBhNDlkOWY0M2MiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MTQ5ODQ3LCJpYXQiOjE3NjUxNDYyNDcsImVtYWlsIjoiYWRtaW4ud2FxYXNAY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdLCJyb2xlIjoiYWRtaW4ifSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluLndhcWFzQGNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoid2FxYXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInJvbGUiOiJhZG1pbiIsInN1YiI6ImU3Y2RiNzEyLWE2ZjQtNDkzYS1iZTg0LTg5MGE0OWQ5ZjQzYyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY1MDYxMDIyfV0sInNlc3Npb25faWQiOiI3NzM3YjYwNi02MDdlLTQyMTYtOWJkYi1lYWExZjU0NWIzMTciLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.7w6zJck6tZCI_xPVenWTeZ07ZhQkXarmclBOH3XEhPg" \
  -H "Content-Type: application/json"