// Debug script to trace the complete add-product flow
const { createClient } = require('@supabase/supabase-js');

// Configuration - Replace with your actual values
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Test product data (same as what the admin panel sends)
const productData = {
  name: "Debug Test Product",
  description: "Testing the complete add-product flow",
  categories: ["Debug", "Test"],
  price: 19.99,
  imageUrl: "https://example.com/debug-test.jpg",
  stock: 10
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAddProductFlow() {
  console.log('=== Debug Add Product Flow ===');
  console.log('Product data being sent:', JSON.stringify(productData, null, 2));
  
  try {
    // Step 1: Check current user session
    console.log('\n1. Checking user session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
      return;
    }
    
    if (!sessionData.session) {
      console.log('❌ No active session found');
      return;
    }
    
    const user = sessionData.session.user;
    console.log('✅ User authenticated');
    console.log('User ID:', user.id);
    console.log('User role (app_metadata):', user.app_metadata?.role);
    console.log('User role (user_metadata):', user.user_metadata?.role);
    
    // Step 2: Verify user has admin role
    const userRole = user.app_metadata?.role || user.user_metadata?.role || 'customer';
    if (userRole !== 'admin') {
      console.log('❌ User is not an admin. Role:', userRole);
      return;
    }
    console.log('✅ User has admin role');
    
    // Step 3: Simulate the exact API call from AdminDashboardPage.tsx
    console.log('\n2. Simulating API call from AdminDashboardPage...');
    
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    const token = sessionData.session.access_token;
    
    console.log('Making request to:', `${functionsUrl}/add-product`);
    console.log('With headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 10)}...` // Only show first 10 chars
    });
    console.log('With body:', JSON.stringify({ productData }, null, 2));
    
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productData })
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
        console.error('Error response:', JSON.stringify(errorResult, null, 2));
      } catch (parseError) {
        console.error('Error text (not JSON):', responseText);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error in debug flow:', error);
  }
}

// Also test direct database access
async function testDirectDatabaseAccess() {
  console.log('\n=== Direct Database Access Test ===');
  
  try {
    console.log('Attempting direct insert into products table...');
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Direct database insert failed:', error);
      return;
    }
    
    console.log('✅ Direct database insert successful');
    console.log('Inserted product:', JSON.stringify(data, null, 2));
    
    // Clean up
    if (data.id) {
      await supabase.from('products').delete().eq('id', data.id);
      console.log('✅ Test product cleaned up');
    }
  } catch (error) {
    console.error('Unexpected error in direct database access:', error);
  }
}

// Run both tests
async function runAllTests() {
  await debugAddProductFlow();
  await testDirectDatabaseAccess();
}

runAllTests();