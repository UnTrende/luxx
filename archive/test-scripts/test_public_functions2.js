// Test script to verify public functions work with empty Authorization header
const supabaseUrl = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';

async function testFunction(functionName) {
  try {
    console.log(`Testing ${functionName}...`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' // Empty bearer token
      }
    });
    
    console.log(`${functionName} status:`, response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${functionName} success:`, Array.isArray(data) ? `${data.length} items` : typeof data);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`${functionName} failed:`, errorText);
      return false;
    }
  } catch (error) {
    console.error(`${functionName} error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('Testing public functions with empty Authorization header...\n');
  
  const results = await Promise.all([
    testFunction('get-barbers'),
    testFunction('get-products'),
    testFunction('get-services')
  ]);
  
  const successCount = results.filter(Boolean).length;
  console.log(`\nResults: ${successCount}/${results.length} functions working`);
}

runTests();