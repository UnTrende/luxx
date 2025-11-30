// Debug script to test product data structure
const testProductData = {
  name: "Test Product",
  description: "This is a test product for verification",
  categories: ["Test", "Verification"],
  price: 19.99,
  imageUrl: "https://example.com/test-product.jpg",
  stock: 10
};

console.log("Product data being sent:");
console.log(JSON.stringify(testProductData, null, 2));

// Check if all required fields are present
const requiredFields = ['name', 'description', 'categories', 'price', 'imageUrl', 'stock'];
const missingFields = requiredFields.filter(field => !(field in testProductData));

if (missingFields.length > 0) {
  console.log("❌ Missing required fields:", missingFields);
} else {
  console.log("✓ All required fields are present");
}

// Check data types
console.log("\nData type verification:");
console.log("- name:", typeof testProductData.name, testProductData.name);
console.log("- description:", typeof testProductData.description, testProductData.description);
console.log("- categories:", Array.isArray(testProductData.categories) ? "array" : typeof testProductData.categories, testProductData.categories);
console.log("- price:", typeof testProductData.price, testProductData.price);
console.log("- imageUrl:", typeof testProductData.imageUrl, testProductData.imageUrl);
console.log("- stock:", typeof testProductData.stock, testProductData.stock);

// Check if categories is properly formatted
if (Array.isArray(testProductData.categories)) {
  console.log("✓ Categories is properly formatted as an array");
} else {
  console.log("❌ Categories should be an array");
}