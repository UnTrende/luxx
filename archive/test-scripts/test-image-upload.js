// Test script for image upload functionality
// This script can be run in the browser console or as a Node.js script

async function testImageUpload() {
  try {
    // Create a test file
    const file = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'product-images');
    formData.append('path', 'test/test-image.jpg');
    formData.append('entityType', 'product');
    
    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://sdxfgugmdrmdjwhagjfa.supabase.co';
    
    // Make the request
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    console.log('Upload result:', result);
    
    if (result.success) {
      console.log('✅ Image upload successful!');
      console.log('Public URL:', result.publicUrl);
    } else {
      console.log('❌ Image upload failed:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testImageUpload();