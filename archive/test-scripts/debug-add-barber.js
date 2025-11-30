// Debug script for add-barber function
// This script can be run in a browser console or Node.js environment

// Replace with your actual Supabase URL and access token
const SUPABASE_URL = 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
const ACCESS_TOKEN = 'YOUR_ADMIN_ACCESS_TOKEN_HERE'; // Get this from an admin user session

// Test data for a new barber
const testBarberData = {
  barberData: {
    name: "Debug Test Barber",
    email: "debug-test@example.com",
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

// Function to check if a user already exists
async function checkUserExists(email) {
  try {
    console.log(`Checking if user with email ${email} exists...`);
    
    // You would need to use the Supabase client to query the database directly
    // This is just a conceptual example
    console.log("You would need to check both auth.users and app_users tables for existing records");
    
  } catch (error) {
    console.error("Error checking user existence:", error);
  }
}

// Run the test
testAddBarber();