// Test script for admin product operations
// This script tests the complete flow of adding a product as an admin

const { createClient } = require('@supabase/supabase-js');

// Configuration - Replace with your actual values
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Get from Supabase dashboard

// Test product data
const testProductData = {
  name: "Test Product From Admin Panel",
  description: "This product is being tested to verify the admin panel functionality",
  categories: ["Test", "Admin"],
  price: 29.99,
  imageUrl: "https://example.com/test-admin-product.jpg",
  stock: 15
};

// Initialize Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testAdminProductAdd() {
  console.log('=== Admin Product Add Test ===');
  console.log('Test product data:', JSON.stringify(testProductData, null, 2));
  
  try {
    // Step 1: Verify products table exists and has correct structure
    console.log('\n1. Checking products table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'products')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Failed to get table structure:', columnsError);
      return;
    }
    
    console.log('✅ Products table exists with columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if imageUrl column exists
    const hasImageUrlColumn = columns.some(col => col.column_name === 'imageUrl');
    if (hasImageUrlColumn) {
      console.log('✅ imageUrl column exists');
    } else {
      console.log('❌ imageUrl column is missing');
    }
    
    // Step 2: Try direct database insertion
    console.log('\n2. Testing direct database insertion...');
    const { data: directInsertData, error: directInsertError } = await supabase
      .from('products')
      .insert([testProductData])
      .select()
      .single();
    
    if (directInsertError) {
      console.error('❌ Direct database insertion failed:', directInsertError);
      return;
    }
    
    console.log('✅ Direct insertion successful');
    console.log('Inserted product ID:', directInsertData.id);
    
    // Clean up the test product
    await supabase.from('products').delete().eq('id', directInsertData.id);
    console.log('✅ Test product cleaned up');
    
    // Step 3: Simulate the API call that the admin panel makes
    console.log('\n3. Simulating admin panel API call...');
    
    // This simulates what happens in services/api.ts -> invoke function
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    
    // Note: In a real scenario, you would need a valid admin access token
    // For this test, we're using the service role key directly
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ productData: testProductData })
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Function call successful');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Clean up if a product was actually created
      if (result.id) {
        await supabase.from('products').delete().eq('id', result.id);
        console.log('✅ Created product cleaned up');
      }
    } else {
      console.error('❌ Function call failed');
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

// Run the test
testAdminProductAdd();