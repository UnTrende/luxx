# Site Settings Storage Implementation

## Overview
This implementation moves the storage of site logo and hero images from localStorage to the database using Supabase Storage and a dedicated settings table.

## Changes Made

### 1. Database Migration
- Created a new `settings` table to store site configuration
- Added columns for:
  - `site_name`: The name of the shop
  - `logo_path`: File path for the site logo in Supabase Storage
  - `logo_bucket`: Storage bucket for the logo
  - `hero_images`: JSON array of file paths for hero images
  - `allow_signups`: Boolean to control user registration

### 2. Edge Functions
- Created `get-settings` function to retrieve site settings
- Created `update-settings` function to update site settings

### 3. Frontend Changes
- Updated `AdminDashboardPage` to store logo and hero images in Supabase Storage
- Updated `Header` component to load logo from the new API
- Updated `HomePage` to load hero images from the new API
- Updated `LoginPage` to load settings from the new API

## Deployment Steps

1. Apply the database migration:
   ```bash
   supabase migration up
   ```

2. Deploy the new Edge Functions:
   ```bash
   supabase functions deploy get-settings
   supabase functions deploy update-settings
   ```

3. The frontend changes will be active once the application is rebuilt

## Benefits

- Centralized storage of site configuration
- Persistence across devices and sessions
- Better scalability and management
- Eliminates localStorage size limitations