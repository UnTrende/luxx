// Test script for duplicate barber checking
// This script can be run in a browser console or Node.js environment

// Replace with your actual Supabase URL and access token
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const ACCESS_TOKEN = 'YOUR_ADMIN_ACCESS_TOKEN_HERE'; // Get this from an admin user session

// Test data for a new barber
const testBarberData = {
  barberData: {
    name: "Test Barber",
    email: "testbarber@example.com",
    password: "securepassword123",
    photo: "https://example.com/photo.jpg",
    experience: 5,
    specialties: ["Haircut", "Beard Trim", "Shave"]
  }
};

// Function to test the add-barber endpoint
async function testAddBarber() {
  try {
    console.log("Testing add-barber function...");
    console.log("Sending data:", JSON.stringify(testBarberData, null, 2));
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-barber`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(testBarberData)
    });
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("✅ Barber added successfully!");
      return result;
    } else {
      console.log("❌ Failed to add barber:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Error testing add-barber function:", error);
    return null;
  }
}

// Function to test duplicate checking
async function testDuplicateCheck() {
  console.log("=== Testing Duplicate Check ===");
  
  // First, try to add a barber
  const firstResult = await testAddBarber();
  
  if (firstResult) {
    console.log("\n=== Trying to add the same barber again (should fail) ===");
    // Try to add the same barber again
    await testAddBarber();
  }
}

// Run the test
testDuplicateCheck();