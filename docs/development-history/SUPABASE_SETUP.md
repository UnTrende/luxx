# Supabase Setup Guide for LuxeCut Barber Shop

This guide will help you set up Supabase to enable the full backend functionality of the LuxeCut Barber Shop application.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com/))
2. Node.js installed on your system

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign up or log in
2. Click "New Project"
3. Choose an organization or create a new one
4. Enter a name for your project (e.g., "LuxeCut Barber Shop")
5. Select a region closest to you
6. Choose the free plan
7. Click "Create New Project"

## Step 2: Get Your API Credentials

Once your project is created:

1. In the Supabase dashboard, click on your project
2. In the left sidebar, click on "Project Settings" (gear icon)
3. Click on "API" in the settings menu
4. Copy the following values:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)

## Step 3: Configure Environment Variables

Update your `.env.local` file with the Supabase credentials:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the values you copied from the Supabase dashboard.

## Step 4: Set Up Database Tables

The application requires the following tables. You can create them using the Supabase SQL editor:

1. In the Supabase dashboard, click on "Table Editor" in the left sidebar
2. Click "New Table" and create the following tables:

Alternatively, you can execute the complete schema script located at `supabase-schema.sql` in the project root directory which contains all the table definitions and sample data.

### Table: app_users
```sql
create table app_users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text not null,
  role text check (role in ('customer', 'barber', 'admin')) not null
);
```

### Table: barbers
```sql
create table barbers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo text,
  experience integer,
  specialties text[],
  rating numeric(3,2),
  active boolean default true,
  user_id uuid references auth.users on delete cascade not null
);
```

### Table: services
```sql
create table services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  duration integer not null,
  price numeric(10,2) not null,
  category text not null
);
```

### Table: barber_services
```sql
create table barber_services (
  id uuid default gen_random_uuid() primary key,
  barber_id uuid references barbers on delete cascade not null,
  service_id uuid references services on delete cascade not null,
  price numeric(10,2) not null
);
```

### Table: products
```sql
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  categories text[],
  price numeric(10,2) not null,
  imageUrl text,
  stock integer not null
);
```

### Table: bookings
```sql
create table bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  userName text not null,
  barber_id uuid references barbers on delete cascade not null,
  service_ids uuid[],
  date date not null,
  timeSlot text not null,
  totalPrice numeric(10,2) not null,
  status text check (status in ('Confirmed', 'Completed', 'Canceled')) not null,
  reviewLeft boolean default false,
  cancelMessage text
);
```

### Table: product_orders
```sql
create table product_orders (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products on delete cascade not null,
  user_id uuid references auth.users on delete cascade,
  userName text not null,
  quantity integer not null,
  status text check (status in ('Reserved', 'PickedUp')) not null,
  timestamp timestamp with time zone not null
);
```

### Table: reviews
```sql
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  barber_id uuid references barbers on delete cascade not null,
  booking_id uuid references bookings on delete cascade not null
);
```

### Table: notifications
```sql
create table notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references auth.users on delete cascade not null,
  type text,
  message text not null,
  payload jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);
```

Alternatively, you can use the complete schema file at `supabase-schema.sql` which includes all tables, indexes, RLS policies, and sample data in a single script.

## Step 5: Set Up Authentication

1. In the Supabase dashboard, go to "Authentication" > "Settings"
2. Make sure "Enable email signup" is turned on
3. You can configure other authentication providers as needed

## Step 6: Enable Automated Role Synchronization

The application includes an automated role synchronization system that keeps user roles consistent between the database and authentication metadata. This is implemented as a database trigger that automatically updates auth metadata when roles change in the app_users table.

To enable this feature:

1. Apply the database migrations:
   ```bash
   supabase db push
   ```

2. The trigger will automatically sync role changes. No additional setup is required.

## Step 7: Deploy Edge Functions

The application uses Supabase Edge Functions for backend operations. To deploy them:

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your_project_id`
4. Deploy functions: `supabase functions deploy`

## Step 8: Test the Setup

1. Restart your development server: `npm run dev`
2. The application should now use the real Supabase backend instead of mock data
3. You can verify this by checking the header - it should no longer show "App is running in Demo Mode"

## Managing User Roles

With the automated role synchronization system:

1. **Adding Users**: When users sign up, they automatically get a database record
2. **Changing Roles**: Simply update the role in the `app_users` table:
   ```sql
   UPDATE app_users SET role = 'admin' WHERE email = 'user@example.com';
   ```
3. **Automatic Sync**: The database trigger will automatically sync the role to auth metadata

For administrators, you can also use the Admin Dashboard interface to manage user roles without writing SQL.

## Troubleshooting

- If you see authentication errors, make sure your Supabase credentials are correct
- If database operations fail, verify that all tables are created correctly
- Check the browser console for any error messages
- Ensure that your Supabase project region matches the one you selected during setup