// Test script to call the test-db-connection function
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
// You need to replace this with a valid admin access token
const ACCESS_TOKEN = 'YOUR_ADMIN_ACCESS_TOKEN_HERE';

async function callTestFunction() {
  try {
    console.log('Calling test-db-connection function...');
    
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
      console.log('✅ Test function executed successfully!');
    } else {
      console.log('❌ Test function failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error calling test function:', error);
    return null;
  }
}

callTestFunction();