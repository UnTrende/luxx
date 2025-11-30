# Fixing Edge Functions Authentication Issues

The "invalid claim: missing sub claim" error occurs because some Edge Functions are not properly handling authentication tokens. Here's how to fix the issues:

## Root Cause

The error happens when Edge Functions try to validate JWT tokens but the required claims are missing or malformed. This typically occurs when:

1. The Authorization header is not properly formatted
2. The token doesn't contain the required `sub` (subject) claim
3. Functions are trying to use admin methods without proper permissions

## Solution Steps

### 1. Update the Authentication Pattern

All Edge Functions should follow this authentication pattern:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inside your function
const client = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
);

const { data: { user }, error: userError } = await client.auth.getUser();
if (userError) throw userError;
if (!user) throw new Error("User not found.");
```

### 2. Fix the add-barber Function

Replace the content of `supabase/functions/add-barber/index.ts` with:

```typescript
// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user and check for admin role
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user || user.app_metadata.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required.");
    }
    
    // 2. Get the barber data
    const { barberData } = await req.json();
    
    // 3. Create the barber profile
    const { data: newBarber, error: profileError } = await supabaseAdmin
        .from('barbers')
        .insert({
            user_id: barberData.userId || '00000000-0000-0000-0000-000000000000',
            name: barberData.name,
            photo: barberData.photo,
            experience: barberData.experience,
            specialties: barberData.specialties,
            active: true
        })
        .select()
        .single();
    if (profileError) throw profileError;

    return new Response(JSON.stringify(newBarber), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

### 3. Ensure Proper Trigger Function Exists

Make sure the trigger function for handling new users is set up in your database. Add this to your schema:

```sql
-- Create trigger function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Update Frontend to Handle User Creation Properly

In the AdminDashboardPage, when adding a barber, you should first create the auth user and then create the barber profile:

```typescript
const handleBarberFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsBarberSubmitting(true);
  try {
    // First create the auth user
    const { data, error } = await supabase.auth.signUp({
      email: barberForm.email,
      password: barberForm.password,
      options: {
        data: {
          name: barberForm.name,
          role: 'barber'
        }
      }
    });
    
    if (error) throw error;
    
    // Then add the barber profile
    await api.addBarber({
      ...barberForm,
      userId: data.user?.id,
      specialties: barberForm.specialties.split(',').map(s => s.trim())
    });
    
    await loadAllData();
    setIsBarberModalOpen(false);
  } catch (error) {
    console.error("Failed to add barber:", error);
    alert(`Error: Could not add barber. ${(error as Error).message}`);
  } finally {
    setIsBarberSubmitting(false);
  }
};
```

### 5. Deploy Updated Functions

After making these changes, redeploy your Edge Functions:

```bash
supabase functions deploy
```

## Testing the Fix

1. Make sure you're logged in as an admin user
2. Try adding a new barber through the admin panel
3. Check the browser console and Supabase function logs for any errors

## Common Issues and Solutions

1. **"Missing Authorization header"**: Ensure the frontend is properly passing the auth token
2. **"User not found"**: Check that the user is properly authenticated before calling the function
3. **"Unauthorized: Admin access required"**: Verify the user has the admin role in their metadata

The key is ensuring that all authenticated Edge Functions follow the same pattern for validating user tokens and checking roles.