// Test script to verify the API layer is working correctly
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Replace with actual anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test product data
const testProductData = {
  name: "API Layer Test Product",
  description: "Testing the API layer",
  categories: ["API", "Test"],
  price: 29.99,
  imageUrl: "https://example.com/api-test.jpg",
  stock: 5
};

async function testApiLayer() {
  console.log('=== API Layer Test ===');
  console.log('Test product data:', JSON.stringify(testProductData, null, 2));
  
  try {
    // Sign in as admin
    console.log('\n1. Signing in as admin...');
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
    
    // Test the exact same way the admin panel calls the API
    console.log('\n2. Testing API call...');
    
    // This simulates what happens in services/api.ts
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    
    // This is how the data is sent now (after our fix)
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(testProductData) // Direct product data, not wrapped
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
        const deleteResponse = await fetch(`${functionsUrl}/delete-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${signInData.session.access_token}`
          },
          body: JSON.stringify({ productId: result.id })
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Test product cleaned up');
        } else {
          console.error('❌ Failed to clean up test product');
        }
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

testApiLayer();