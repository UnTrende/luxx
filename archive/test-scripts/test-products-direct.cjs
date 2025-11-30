// Test script to directly access products table
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get from your Supabase dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectAccess() {
  try {
    console.log('Testing direct access to products table...');
    
    // Try to get products directly
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Direct access error:', error);
      return;
    }
    
    console.log('Direct access successful');
    console.log('Data:', JSON.stringify(data, null, 2));
    
    // Check fields
    if (data && data.length > 0) {
      const product = data[0];
      console.log('Product fields:');
      Object.keys(product).forEach(key => {
        console.log(`  - ${key}: ${typeof product[key]}`);
      });
      
      if ('imageUrl' in product) {
        console.log('✓ imageUrl field exists');
      } else {
        console.log('✗ imageUrl field missing');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDirectAccess();