# Barber Roster Feature Implementation

## Overview
This feature allows barbers to view their work schedules (rosters) in the barber dashboard. The implementation includes:

1. A new `BarberRosterCard` component that displays the barber's schedule
2. Integration of this component into the `BarberDashboardPage`
3. Backend API support through Edge Functions
4. Type definitions for roster data

## Components

### BarberRosterCard.tsx
- Located in `/components/BarberRosterCard.tsx`
- Displays the barber's weekly schedule
- Shows working days, hours, and days off
- Allows barbers to view multiple weeks if available
- Includes a refresh button to update schedule data

### BarberDashboardPage.tsx
- The roster card has been integrated into the barber dashboard
- Positioned at the top of the dashboard for easy access

## API Endpoints

### getBarberRosters()
- Located in `/services/api.ts`
- Calls the `get-barber-roster` Edge Function
- Returns roster data specific to the logged-in barber

## Edge Functions

### get-barber-roster
- Located in `/supabase/functions/get-barber-roster/index.ts`
- Authenticates the user and retrieves their roster information
- Filters roster data to only include schedules for the requesting barber

## Data Structure

The roster data includes:
- Week key (format: YYYY-W##)
- Week dates (array of 7 date strings)
- Schedules for each barber
- Shift information (start time, end time, day off status)

## Features

1. **Schedule Display**: Shows the barber's schedule in an easy-to-read grid format
2. **Multiple Weeks**: If multiple weeks are available, barbers can switch between them
3. **Day Off Indication**: Clearly marks days when the barber is off
4. **Refresh Capability**: Allows barbers to refresh their schedule data
5. **Responsive Design**: Works well on different screen sizes

## Usage

Barbers can view their schedules by simply logging into their dashboard. The roster card will automatically load and display their current schedule. If schedules for multiple weeks are available, they can use the dropdown to switch between weeks.