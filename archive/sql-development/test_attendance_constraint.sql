-- Test if the new status values are allowed
INSERT INTO attendance (barber_id, date, status) 
VALUES ('test-id', '2023-10-28', 'clocked-in')
ON CONFLICT DO NOTHING;