// Test script for roster functions
const testData = {
  name: "Test Roster " + Date.now(),
  startDate: "2024-01-01",
  endDate: "2024-01-07",
  days: [
    {
      date: "2024-01-01",
      shifts: [
        {
          barberId: "test-barber-1",
          startTime: "09:00",
          endTime: "17:00",
          isDayOff: false
        }
      ]
    }
  ]
};

console.log('Test data prepared:', testData);
console.log('You can now test the roster functions with this data.');