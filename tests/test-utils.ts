import { logger } from '../src/lib/logger';

import { assertEquals, assertRejects } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class TestEnvironment {
  static async setup() {
    // Create test database client
    const supabase = createClient(
      Deno.env.get('SUPABASE_TEST_URL')!,
      Deno.env.get('SUPABASE_TEST_SERVICE_ROLE_KEY')!
    );
    
    return {
      supabase,
      cleanup: async () => {
        // Clean up test data
        await supabase.from('test_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
    };
  }
  
  static async createTestUser(role: 'customer' | 'barber' | 'admin' = 'customer') {
    const supabase = createClient(
      Deno.env.get('SUPABASE_TEST_URL')!,
      Deno.env.get('SUPABASE_TEST_SERVICE_ROLE_KEY')!
    );
    
    const email = `test-${Date.now()}-${Math.random()}@example.com`;
    
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: 'test123456',
      email_confirm: true,
      user_metadata: { role }
    });
    
    if (error) throw error;
    return user;
  }
}

export function describe(name: string, fn: () => void) {
  if (process.env.NODE_ENV === 'development') console.group(`🧪 ${name}`);
  try {
    fn();
  } finally {
    if (process.env.NODE_ENV === 'development') console.groupEnd();
  }
}