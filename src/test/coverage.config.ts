/**
 * Test coverage configuration and utilities
 */

export const COVERAGE_THRESHOLDS = {
  statements: 70,
  branches: 70,
  functions: 70,
  lines: 70,
};

export const COVERAGE_EXCLUDE = [
  'node_modules/**',
  'dist/**',
  'supabase/migrations/**',
  '**/*.d.ts',
  '**/*.config.*',
  'vite.config.ts',
  'tailwind.config.cjs',
  'postcss.config.cjs',
  'src/test/**',
  'tests/**',
  '**/*.test.*',
  '**/*.spec.*',
  'tmp_rovodev_*',
];

export const PRIORITY_FILES = [
  // Core authentication and state management
  'contexts/AuthContext.tsx',
  'contexts/SettingsContext.tsx', 
  'contexts/NotificationContext.tsx',
  
  // Critical business logic
  'services/api.ts',
  'services/supabaseClient.ts',
  'utils/validation.ts',
  'utils/rosterUtils.ts',
  
  // Key user flows
  'components/BookingFlow.test.tsx', // Already has some tests
  'pages/BookingPage.tsx',
  'pages/LoginPage.tsx',
  'pages/HomePage.tsx',
  
  // Admin functionality
  'components/admin/AdminBookingsManager.tsx',
  'components/admin/AdminBarbersManager.tsx',
  
  // Safety infrastructure
  'supabase/functions/_shared/auth.ts',
  'supabase/functions/_shared/validation-suite.ts',
  'supabase/functions/_shared/rate-limiter.ts',
];

export const TEST_CATEGORIES = {
  unit: {
    pattern: '**/*.test.{ts,tsx}',
    timeout: 5000,
  },
  integration: {
    pattern: 'tests/integration/**/*.test.{ts,tsx}',
    timeout: 10000,
  },
  e2e: {
    pattern: 'tests/e2e/**/*.test.{ts,tsx}',
    timeout: 30000,
  },
  load: {
    pattern: 'tests/load/**/*.test.{ts,tsx}',
    timeout: 60000,
  }
};

export const MOCK_STRATEGIES = {
  // Mock Supabase completely for unit tests
  FULL_MOCK: 'full',
  
  // Use real Supabase with test database for integration tests
  REAL_DB: 'real',
  
  // Mix - mock external APIs but use real internal logic
  HYBRID: 'hybrid'
};