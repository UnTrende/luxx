// Test script to verify public functions work with the new retry mechanism
const supabaseUrl = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';

async function testFunction(functionName) {
  try {
    console.log(`Testing ${functionName}...`);
    
    // First try without Authorization header
    let response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });
    
    console.log(`${functionName} first attempt status:`, response.status);
    
    // If we get an auth error, try with empty Authorization header
    if (response.status === 401) {
      console.log(`${functionName} retrying with empty Authorization header...`);
      response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer '
        }
      });
      console.log(`${functionName} retry status:`, response.status);
    }
    
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
  console.log('Testing public functions with retry mechanism...\n');
  
  const results = await Promise.all([
    testFunction('get-barbers'),
    testFunction('get-products'),
    testFunction('get-services')
  ]);
  
  const successCount = results.filter(Boolean).length;
  console.log(`\nResults: ${successCount}/${results.length} functions working`);
}

runTests();