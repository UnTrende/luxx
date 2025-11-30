# Fixed Barber Email Issue

This document summarizes the fix for the missing email column issue in the barbers table.

## Problem
The Edge Function was trying to fetch the `email` column from the barbers table, but this column doesn't exist in the database schema. The barbers table only has the following columns:
- id
- name
- photo
- experience
- specialties
- rating
- active
- user_id

## Solution
Updated the Edge Function to only fetch the available columns from the barbers table:

1. Modified the select query in `supabase/functions/create-roster/index.ts` to only request `id` and `name` columns
2. Removed the `employeeEmail` field from the enriched schedules since it's not available
3. Kept only the essential barber information needed for roster creation

## Changes Made
- Updated the database query to: `.select('id, name')`
- Removed `employeeEmail: barber.email` from the enriched schedules
- Deployed the fixed function to Supabase

## Verification
- Successfully deployed the updated function
- Confirmed the application builds without errors

The roster management functionality should now work correctly without requiring the email column that doesn't exist in the barbers table.