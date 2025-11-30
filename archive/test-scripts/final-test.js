// Final comprehensive test to check if the product issue is resolved
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Replace with actual anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test product data
const testProductData = {
  name: "Final Test Product",
  description: "Final test to check if the issue is resolved",
  categories: ["Final", "Test"],
  price: 39.99,
  imageUrl: "https://example.com/final-test.jpg",
  stock: 8
};

async function finalTest() {
  console.log('=== Final Test to Check Product Issue Resolution ===');
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
    
    // Test the add-product function directly
    console.log('\n2. Testing add-product function directly...');
    
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    
    // Send the request exactly as the admin panel does
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(testProductData)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Product added successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Clean up by deleting the test product
      if (result.id) {
        console.log('\n3. Cleaning up test product...');
        const deleteResponse = await fetch(`${functionsUrl}/delete-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${signInData.session.access_token}`
          },
          body: JSON.stringify({ productId: result.id })
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Test product cleaned up successfully');
        } else {
          console.error('❌ Failed to clean up test product');
          const deleteResponseText = await deleteResponse.text();
          console.error('Delete response:', deleteResponseText);
        }
      }
      
      console.log('\n🎉 SUCCESS: The product issue has been resolved!');
    } else {
      console.error('❌ Failed to add product');
      try {
        const errorResult = JSON.parse(responseText);
        console.error('Error details:', JSON.stringify(errorResult, null, 2));
        
        if (errorResult.error && errorResult.error.includes('imageUrl')) {
          console.error('\n🚨 The imageUrl column issue is still present!');
          console.error('This indicates the schema cache has not been refreshed properly.');
        }
      } catch (e) {
        console.error('Error text (not JSON):', responseText);
      }
      
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check the Supabase dashboard for function logs');
      console.log('2. Verify the products table has the imageUrl column');
      console.log('3. Try redeploying the functions again');
      console.log('4. Check if the database schema matches the expected structure');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== Test Completed ===');
}

finalTest();