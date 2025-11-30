// Test script to call the test-db-connection function
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const ACCESS_TOKEN = 'YOUR_ADMIN_ACCESS_TOKEN_HERE'; // Replace with actual admin access token

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/test-db-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Database connection test successful!');
    } else {
      console.log('❌ Database connection test failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return null;
  }
}

testDbConnection();