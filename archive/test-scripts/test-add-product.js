// Test script for add product functionality
// This script can be run in a browser console or Node.js environment

// Replace with your actual Supabase URL and access token
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const ACCESS_TOKEN = 'YOUR_ADMIN_ACCESS_TOKEN_HERE'; // Get this from an admin user session

// Test data for a new product
const testProductData = {
  name: "Test Product",
  description: "This is a test product for verification",
  categories: ["Test", "Verification"],
  price: 19.99,
  imageUrl: "https://example.com/test-product.jpg",
  stock: 10
};

// Function to test the add-product endpoint
async function testAddProduct() {
  try {
    console.log("Testing add-product function...");
    console.log("Sending data:", JSON.stringify(testProductData, null, 2));
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ productData: testProductData })
    });
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("✅ Product added successfully!");
      return result;
    } else {
      console.log("❌ Failed to add product:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Error testing add-product function:", error);
    return null;
  }
}

// Run the test
testAddProduct();