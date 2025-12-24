# Deployment Guide for Roster-Based Availability Enhancement

## Overview
This guide explains how to deploy the new `is-barber-available` Edge Function that enables roster-based availability checking in the booking system.

## Prerequisites
1. Supabase CLI installed (`supabase`)
2. Docker running (for local development)
3. Supabase project linked

## Files Created
1. `/supabase/functions/is-barber-available/index.ts` - The new Edge Function
2. `/services/api.ts` - Updated with `isBarberAvailable` method
3. `/supabase/functions/_shared/types.ts` - Updated API interface
4. `/components/DateTimeSelectionStep.tsx` - Updated UI to show available dates
5. Documentation files explaining the implementation

## Deployment Steps

### 1. Local Development (if Docker is available)
```bash
# Start Supabase local development stack
supabase start

# Deploy functions locally
supabase functions deploy is-barber-available --project-id your-project-id
```

### 2. Production Deployment
```bash
# Deploy to production
supabase functions deploy is-barber-available --project-id your-project-id --prod
```

### 3. Manual Deployment (if CLI is not available)
1. Navigate to your Supabase Dashboard
2. Go to "Functions" in the sidebar
3. Click "Create Function"
4. Name it "is-barber-available"
5. Copy the contents of `/supabase/functions/is-barber-available/index.ts`
6. Paste it into the function editor
7. Deploy the function

## Testing the Function
After deployment, you can test the function with:

```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/is-barber-available?barberId=BARBER_ID&date=2023-12-25' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'X-CSRF-Token: YOUR_CSRF_TOKEN'
```

## Verifying the Implementation
1. Restart your development server
2. Navigate to the booking flow
3. Select a barber
4. Observe that only dates when the barber is scheduled to work are selectable
5. Dates when the barber is off-duty should show with reduced opacity and an "OFF" indicator

## Troubleshooting

### Common Issues
1. **Function not found**: Ensure the function is deployed and named correctly
2. **Authentication errors**: Verify CSRF token is being sent with requests
3. **Roster data not found**: Check that roster data exists for the date range

### Logs
Check function logs in the Supabase Dashboard under the "Functions" section to debug any issues.

## Rollback Plan
If issues arise, you can rollback by:
1. Reverting the changes to `/components/DateTimeSelectionStep.tsx`
2. Removing the `isBarberAvailable` method from `/services/api.ts`
3. Removing the method signature from `/supabase/functions/_shared/types.ts`
4. Optionally deleting the `is-barber-available` function if needed