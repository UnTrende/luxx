// Final test to check database connectivity and table structure
const { createClient } = require('@supabase/supabase-js');

// Configuration - Use service role key for full access
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalDatabaseTest() {
  console.log('=== Final Database Test ===');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('\n1. Testing database connectivity...');
    const { data: healthData, error: healthError } = await supabase
      .from('products')
      .select('count()', { head: true, count: 'exact' });
    
    if (healthError) {
      console.error('❌ Database connectivity test failed:', healthError);
      return;
    }
    
    console.log('✅ Database connectivity successful');
    console.log('Current products count:', healthData.count);
    
    // Test 2: Check table structure
    console.log('\n2. Checking products table structure...');
    const { data: columns, error: columnsError } = await supabase
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
    
    // Check specifically for imageUrl column
    const imageUrlColumn = columns.find(col => col.column_name === 'imageUrl');
    if (imageUrlColumn) {
      console.log('✅ imageUrl column exists');
    } else {
      console.log('❌ imageUrl column is missing');
    }
    
    // Test 3: Try to insert a product directly
    console.log('\n3. Testing direct product insertion...');
    const testProduct = {
      name: "Direct Insert Test",
      description: "Testing direct database insertion",
      categories: ["Direct", "Test"],
      price: 39.99,
      imageUrl: "https://example.com/direct-test.jpg",
      stock: 3
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Direct insertion failed:', insertError);
      return;
    }
    
    console.log('✅ Direct insertion successful');
    console.log('Inserted product ID:', insertData.id);
    
    // Clean up
    await supabase.from('products').delete().eq('id', insertData.id);
    console.log('✅ Test product cleaned up');
    
    console.log('\n=== All Tests Completed Successfully ===');
    console.log('If direct database access works but the admin panel doesn\'t,');
    console.log('the issue is likely in the authentication flow or function invocation.');
    
  } catch (error) {
    console.error('Unexpected error in final test:', error);
  }
}

finalDatabaseTest();