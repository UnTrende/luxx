// Test script to verify the authentication flow for admin operations
const { createClient } = require('@supabase/supabase-js');

// Configuration - Replace with your actual values
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
  console.log('=== Authentication Flow Test ===');
  
  try {
    // Step 1: Sign in as admin (you'll need to replace with actual admin credentials)
    console.log('Signing in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@luxecut.com', // Replace with actual admin email
      password: 'password123'      // Replace with actual admin password
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }
    
    console.log('✅ Signed in successfully');
    console.log('User ID:', signInData.user.id);
    console.log('Access token:', signInData.session.access_token.substring(0, 20) + '...');
    console.log('User app_metadata:', signInData.user.app_metadata);
    console.log('User user_metadata:', signInData.user.user_metadata);
    
    // Step 2: Check if user has admin role
    const userRole = signInData.user.app_metadata?.role || signInData.user.user_metadata?.role || 'customer';
    console.log('User role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('❌ User is not an admin');
      return;
    }
    
    console.log('✅ User has admin role');
    
    // Step 3: Test calling the add-product function
    console.log('\nTesting add-product function call...');
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    const testProductData = {
      name: "Auth Flow Test Product",
      description: "Testing the authentication flow",
      categories: ["Auth", "Test"],
      price: 49.99,
      imageUrl: "https://example.com/auth-flow-test.jpg",
      stock: 5
    };
    
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify({ productData: testProductData })
    });
    
    console.log('Response status:', response.status);
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
        console.error('Error text:', responseText);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuthFlow();