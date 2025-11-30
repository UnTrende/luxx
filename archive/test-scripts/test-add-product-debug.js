// Debug test for add-product function with detailed logging
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testProductData = {
  name: "Debug Test Product",
  description: "Testing with detailed logging",
  categories: ["Debug", "Test"],
  price: 29.99,
  imageUrl: "https://example.com/debug-test.jpg",
  stock: 7
};

async function testAddProductDebug() {
  console.log('=== Add Product Debug Test ===');
  console.log('Test product data:', JSON.stringify(testProductData, null, 2));
  
  try {
    // First, sign in to get a valid session
    console.log('\n1. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@luxecut.com', // Replace with actual admin credentials
      password: 'password123'     // Replace with actual admin password
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      console.log('NOTE: You need to replace the admin credentials with actual ones');
      return;
    }
    
    console.log('✅ Signed in successfully');
    console.log('User ID:', signInData.user.id);
    console.log('Role:', signInData.user.app_metadata?.role);
    
    // Now test the add-product function
    console.log('\n2. Calling add-product function...');
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    
    const requestBody = { productData: testProductData };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Product added successfully');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Clean up
      if (result.id) {
        await supabase.from('products').delete().eq('id', result.id);
        console.log('✅ Test product cleaned up');
      }
    } else {
      console.error('❌ Failed to add product');
      try {
        const errorResult = JSON.parse(responseText);
        console.error('Error details:', JSON.stringify(errorResult, null, 2));
      } catch (e) {
        console.error('Error text (not JSON):', responseText);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAddProductDebug();