// create_test_roster.ts - Script to create a test roster
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestRoster() {
  try {
    // First, get the barber ID we want to assign shifts to
    // Using the barber ID from the logs: 9e3a68cb-ab6d-4f54-845c-767bba62d488
    const barberId = '9e3a68cb-ab6d-4f54-845c-767bba62d488';
    
    // Create test roster data
    const testRoster = {
      name: 'Test Roster 2025-W46',
      start_date: '2025-11-10',
      end_date: '2025-11-16',
      days: [
        {
          date: '2025-11-10',
          shifts: [
            {
              barberId: barberId,
              startTime: '09:00',
              endTime: '17:00',
              isDayOff: false
            }
          ]
        },
        {
          date: '2025-11-11',
          shifts: [
            {
              barberId: barberId,
              startTime: '10:00',
              endTime: '18:00',
              isDayOff: false
            }
          ]
        },
        {
          date: '2025-11-12',
          shifts: [
            {
              barberId: barberId,
              startTime: '08:00',
              endTime: '16:00',
              isDayOff: false
            }
          ]
        }
      ]
    };

    console.log('Creating test roster:', JSON.stringify(testRoster, null, 2));

    // Insert the test roster
    const { data, error } = await supabase
      .from('rosters')
      .insert([testRoster])
      .select();

    if (error) {
      console.error('Error creating test roster:', error);
      return;
    }

    console.log('Test roster created successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createTestRoster();