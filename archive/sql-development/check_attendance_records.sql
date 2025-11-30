-- Check if attendance records exist in the database
SELECT 
  b.name as barber_name,
  a.date,
  a.status
FROM attendance a
JOIN barbers b ON a.barber_id = b.id
ORDER BY a.date DESC, b.name;