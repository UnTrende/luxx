// Test script for update-barber functionality
// This script can be run in the browser console

async function testUpdateBarber() {
  try {
    // Get the Supabase URL and token from environment
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
    // You'll need to get a valid token from an admin user
    const token = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual token
    
    // Test data - replace with actual barber ID and data
    const testData = {
      id: 'ACTUAL_BARBER_ID_HERE', // Replace with actual barber ID
      name: 'Updated Barber Name',
      email: 'updated@example.com',
      specialties: ['Haircut', 'Beard Trim', 'Shave'],
      photo_path: 'path/to/photo.jpg',
      is_active: true
    };
    
    // Make the request
    const response = await fetch(`${supabaseUrl}/functions/v1/update-barber`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    console.log('Update result:', result);
    
    if (result.success) {
      console.log('✅ Barber update successful!');
      console.log('Updated data:', result.data);
    } else {
      console.log('❌ Barber update failed:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test (uncomment the line below to run)
// testUpdateBarber();