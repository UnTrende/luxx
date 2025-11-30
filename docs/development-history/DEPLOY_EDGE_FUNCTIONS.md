# Deploy Edge Functions

## Prerequisites
1. Supabase CLI installed
2. Logged into your Supabase account
3. Project linked

## Deployment Steps

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (replace YOUR_PROJECT_ID with your actual Supabase project ID):
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. Deploy the functions:
   ```bash
   supabase functions deploy
   ```

## Verify Deployment

After deployment, you can test the attendance feature:

1. Make sure you have some barbers in your database
2. Log in as an admin user
3. Go to the Admin Dashboard
4. You should now see the attendance records in the "Today's Attendance" section

## How the Automatic Attendance Works

When a barber logs into their dashboard:
1. The BarberDashboardPage.tsx automatically calls `api.updateAttendance('', 'Present', true)`
2. This triggers the `update-attendance` Edge Function with `autoUpdate = true`
3. The function looks up the barber by their user ID and updates their attendance status to "Present"
4. This attendance record is then visible in the admin dashboard

## Check Attendance Records

You can verify attendance records exist by running the `check_attendance_records.sql` script in your Supabase SQL Editor.