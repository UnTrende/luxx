// This file now acts as a proxy to the shared types defined for the entire full-stack application.
// This ensures that both the frontend and the Deno Edge Functions use the exact same data structures,
// fulfilling the "Contract Layer" requirement of the new architecture.
export * from './supabase/functions/_shared/types';
