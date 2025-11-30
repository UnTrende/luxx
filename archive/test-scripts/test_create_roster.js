// test_create_roster.js - Test script to verify create-roster function
const supabaseUrl = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0MzYxMzgsImV4cCI6MjAzODAxMjEzOH0.I3KMX5110Vlis4EkvDERlzZ7q8o-5RTRlrPM1rnZX-w';

// Test data
const testRosterData = {
  name: "Test Roster 2025-W46",
  startDate: "2025-11-10",
  endDate: "2025-11-16",
  days: [
    {
      date: "2025-11-10",
      shifts: [
        {
          barberId: "9e3a68cb-ab6d-4f54-845c-767bba62d488",
          startTime: "09:00",
          endTime: "17:00",
          isDayOff: false
        }
      ]
    },
    {
      date: "2025-11-11",
      shifts: [
        {
          barberId: "9e3a68cb-ab6d-4f54-845c-767bba62d488",
          startTime: "10:00",
          endTime: "18:00",
          isDayOff: false
        }
      ]
    }
  ]
};

// Function to test create-roster
async function testCreateRoster() {
  try {
    console.log('Testing create-roster function...');
    console.log('Sending data:', JSON.stringify(testRosterData, null, 2));
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-roster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(testRosterData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Roster created successfully!');
      return responseData;
    } else {
      console.error('❌ Failed to create roster:', responseData);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing create-roster:', error);
    return null;
  }
}

// Run the test
testCreateRoster();