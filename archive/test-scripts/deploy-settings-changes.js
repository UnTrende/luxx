#!/usr/bin/env node

// Script to deploy the settings changes
const { execSync } = require('child_process');
const path = require('path');

const projectDir = path.resolve(__dirname);

console.log('Deploying settings changes...');

try {
  // Apply the new migration
  console.log('Applying database migration...');
  execSync('supabase migration up', { cwd: projectDir, stdio: 'inherit' });
  
  // Deploy the new Edge Functions
  console.log('Deploying Edge Functions...');
  execSync('supabase functions deploy get-settings', { cwd: projectDir, stdio: 'inherit' });
  execSync('supabase functions deploy update-settings', { cwd: projectDir, stdio: 'inherit' });
  
  console.log('Settings changes deployed successfully!');
} catch (error) {
  console.error('Error deploying settings changes:', error.message);
  process.exit(1);
}