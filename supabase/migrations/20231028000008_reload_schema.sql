-- Reload PostgREST schema cache to resolve Edge Function schema issues
SELECT pg_notify('pgrst', 'reload schema');