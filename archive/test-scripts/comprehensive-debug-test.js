// Comprehensive debug test for the entire admin product add flow
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // For direct database access
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // For simulating frontend calls

// Test data
const testProductData = {
  name: "Comprehensive Debug Test Product",
  description: "Testing the complete flow from admin panel to database",
  categories: ["Debug", "Test", "Comprehensive"],
  price: 59.99,
  imageUrl: "https://example.com/comprehensive-debug-test.jpg",
  stock: 12
};

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseFrontend = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveDebugTest() {
  console.log('=== Comprehensive Debug Test ===');
  console.log('Test product data:', JSON.stringify(testProductData, null, 2));
  
  try {
    // Test 1: Direct database access (bypassing all functions)
    console.log('\n--- Test 1: Direct Database Access ---');
    const { data: directData, error: directError } = await supabaseAdmin
      .from('products')
      .insert([testProductData])
      .select()
      .single();
    
    if (directError) {
      console.error('❌ Direct database insert failed:', directError);
      return;
    }
    
    console.log('✅ Direct database insert successful');
    console.log('Product ID:', directData.id);
    
    // Clean up
    await supabaseAdmin.from('products').delete().eq('id', directData.id);
    console.log('✅ Test product cleaned up');
    
    // Test 2: Check if products table exists and has correct structure
    console.log('\n--- Test 2: Table Structure Verification ---');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'products')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Failed to get table structure:', columnsError);
      return;
    }
    
    console.log('✅ Products table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    const imageUrlColumn = columns.find(col => col.column_name === 'imageUrl');
    if (imageUrlColumn) {
      console.log('✅ imageUrl column exists');
    } else {
      console.log('❌ imageUrl column is missing');
    }
    
    // Test 3: Simulate frontend API call
    console.log('\n--- Test 3: Frontend API Call Simulation ---');
    
    // This simulates what happens in services/api.ts
    const functionsUrl = `${SUPABASE_URL}/functions/v1`;
    
    const response = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: No authentication header to see what happens
      },
      body: JSON.stringify({ productData: testProductData })
    });
    
    console.log('Unauthenticated response status:', response.status);
    const responseText = await response.text();
    console.log('Unauthenticated response text:', responseText);
    
    // Test 4: Check what happens with malformed data
    console.log('\n--- Test 4: Malformed Data Test ---');
    const malformedData = {
      name: "Malformed Test Product",
      // Missing required fields
    };
    
    const malformedResponse = await fetch(`${functionsUrl}/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productData: malformedData })
    });
    
    console.log('Malformed data response status:', malformedResponse.status);
    const malformedResponseText = await malformedResponse.text();
    console.log('Malformed data response text:', malformedResponseText);
    
    // Test 5: Check the actual products table in database
    console.log('\n--- Test 5: Current Products Count ---');
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Failed to count products:', countError);
    } else {
      console.log('Current number of products in database:', count);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Unexpected error in comprehensive test:', error);
  }
}

comprehensiveDebugTest();