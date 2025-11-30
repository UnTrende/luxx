// Test script to verify barber add/edit logic
// This can be run in the browser console

// Test 1: Simulate adding a new barber
function testAddBarberLogic() {
  console.log('=== Test 1: Adding New Barber ===');
  
  // Simulate the state when adding a new barber
  const editingBarber = null; // No barber being edited
  const shouldUpdate = editingBarber && editingBarber.id;
  
  console.log('editingBarber:', editingBarber);
  console.log('shouldUpdate:', shouldUpdate);
  console.log('Expected: shouldUpdate = false (adding new barber)');
  
  if (!shouldUpdate) {
    console.log('✅ CORRECT: Logic correctly identifies this as an ADD operation');
  } else {
    console.log('❌ ERROR: Logic incorrectly identifies this as an UPDATE operation');
  }
}

// Test 2: Simulate editing an existing barber
function testEditBarberLogic() {
  console.log('\n=== Test 2: Editing Existing Barber ===');
  
  // Simulate the state when editing an existing barber
  const editingBarber = { id: 'barber-123', name: 'John Doe' }; // Existing barber being edited
  const shouldUpdate = editingBarber && editingBarber.id;
  
  console.log('editingBarber:', editingBarber);
  console.log('shouldUpdate:', shouldUpdate);
  console.log('Expected: shouldUpdate = true (editing existing barber)');
  
  if (shouldUpdate) {
    console.log('✅ CORRECT: Logic correctly identifies this as an UPDATE operation');
  } else {
    console.log('❌ ERROR: Logic incorrectly identifies this as an ADD operation');
  }
}

// Run the tests
testAddBarberLogic();
testEditBarberLogic();

console.log('\n=== Test Complete ===');