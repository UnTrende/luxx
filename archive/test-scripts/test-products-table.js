// Test script to verify products table structure
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and service role key
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
// You can get the service role key from your Supabase project dashboard
// Settings -> API -> Service Role Key (not the anon/public key)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGZndWdtZHJtZGp3aGFnamZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODQ1MTQzNywiZXhwIjoyMDE0MDI3NDM3fQ.JvZ3rXkZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZ'; // Replace with actual key

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProductsTable() {
  try {
    console.log('Testing products table structure...');
    
    // Try to get the table info
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying products table:', error);
      console.log('This error indicates that either:');
      console.log('1. The products table does not exist');
      console.log('2. The imageUrl column does not exist');
      console.log('3. There are permission issues');
      return;
    }
    
    console.log('Products table query successful');
    console.log('Sample data:', JSON.stringify(data, null, 2));
    
    // Check if imageUrl field exists in the returned data
    if (data && data.length > 0) {
      const sampleProduct = data[0];
      console.log('Fields in products table:');
      Object.keys(sampleProduct).forEach(key => {
        console.log(`  - ${key}`);
      });
      
      if ('imageUrl' in sampleProduct) {
        console.log('✓ imageUrl field exists in the table');
      } else {
        console.log('✗ imageUrl field does NOT exist in the table');
        console.log('This confirms the schema cache issue');
      }
    } else {
      console.log('No data returned from products table');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Also test if we can insert a product
async function testInsertProduct() {
  try {
    console.log('\nTesting product insertion...');
    
    const testProduct = {
      name: "Test Product",
      description: "Test product for schema verification",
      categories: ["Test"],
      price: 9.99,
      imageUrl: "https://example.com/test.jpg",
      stock: 5
    };
    
    const { data, error } = await supabase
      .from('products')
      .insert([testProduct])
      .select();
    
    if (error) {
      console.error('Error inserting product:', error);
      return;
    }
    
    console.log('Product insertion successful');
    console.log('Inserted product:', JSON.stringify(data, null, 2));
    
    // Clean up - delete the test product
    if (data && data.length > 0) {
      const productId = data[0].id;
      await supabase.from('products').delete().eq('id', productId);
      console.log('Test product cleaned up');
    }
  } catch (error) {
    console.error('Unexpected error during insertion test:', error);
  }
}

async function main() {
  await testProductsTable();
  await testInsertProduct();
}

main();