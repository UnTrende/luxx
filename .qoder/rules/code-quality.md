---
trigger: model_decision
description: "Maintain code quality and best practices"
---

# Code Quality and Best Practices

## Code Quality Rules
1. TYPE SAFETY - TypeScript types MUST be used consistently throughout the codebase.
2. NAMING CONVENTIONS - Variables and functions MUST use descriptive camelCase names.
3. CONSISTENT PATTERNS - Similar functionality MUST follow established patterns.
4. DOCUMENTATION - Complex logic MUST be documented with inline comments.

## Immutability/Side Effects Rules
1. PURE FUNCTIONS - Business logic functions SHOULD be pure with minimal side effects.
2. STATE ISOLATION - Component state MUST be properly isolated and managed.
3. ASYNC HANDLING - Asynchronous operations MUST handle errors appropriately.
4. DATA CONSISTENCY - Database operations MUST maintain data integrity through transactions where needed.

## Performance Rules
1. LAZY LOADING - Non-critical components MUST be lazy-loaded.
2. CACHING - Frequently accessed data SHOULD be cached appropriately.
3. BUNDLE SIZE - Code splitting MUST be used to minimize bundle sizes.
4. DATABASE QUERIES - Queries MUST be optimized and avoid N+1 problems.

## Testing Rules
1. UNIT TEST COVERAGE - All business logic functions MUST have unit tests covering normal and edge cases.
2. INTEGRATION TESTING - API endpoints MUST be tested with real database interactions.
3. SECURITY TESTING - Authentication bypass attempts MUST be tested regularly.
4. REGRESSION PREVENTION - Bug fixes MUST include tests to prevent recurrence.

## Database Schema Rules
1. MIGRATION SAFETY - Schema changes MUST be backward compatible when possible.
2. COLUMN REFERENCES - Code MUST be updated when database columns are added/removed.
3. INDEXING - Frequently queried columns MUST be indexed for performance.
4. RELATIONSHIPS - Foreign key relationships MUST be properly maintained.

## Error Handling Rules
1. USER-FRIENDLY MESSAGES - Error messages shown to users MUST be informative but not expose system details.
2. LOGGING - All errors MUST be logged with sufficient context for debugging.
3. RECOVERY - Systems MUST gracefully handle errors and provide recovery paths.
4. SECURITY LOGS - Security-related errors MUST be logged to dedicated security logs table.

## Configuration Rules
1. ENVIRONMENT VARIABLES - All environment-specific values (API keys, URLs, feature flags) MUST be loaded from environment variables, never hardcoded.
2. SECRET MANAGEMENT - Sensitive data MUST be stored in Supabase secrets, not in code or .env files.
3. FEATURE FLAGS - New features MUST be controlled by feature flags for safe rollouts and easy rollback.
4. DATABASE CONNECTIONS - Database connections MUST use service role keys for Edge Functions, anon keys for client-side.

## Deployment Rules
1. STAGING FIRST - All changes MUST be tested in staging before production.
2. ROLLBACK READY - Every deployment MUST have a clear rollback procedure.
3. MONITORING - Deployed features MUST be monitored for errors and performance.
4. INCREMENTAL ROLLOUT - Major features SHOULD be rolled out gradually to users.

## Implementation Examples

### Good naming conventions:
```typescript
// Good
const getUserProfile = async (userId: string): Promise<UserProfile> => { ... }
const calculateTotalPrice = (items: CartItem[]): number => { ... }
const isValidEmail = (email: string): boolean => { ... }

// Avoid
const get_user_profile = async (user_id: string): Promise<any> => { ... }
const calc = (items: any[]): any => { ... }
const check = (email: string): boolean => { ... }
```

### Proper error handling:
```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  // Log with sufficient context
  console.error('Failed to perform operation:', {
    error: error.message,
    userId: currentUser?.id,
    timestamp: new Date().toISOString()
  });
  
  // Return user-friendly message
  throw new Error('Unable to complete the operation. Please try again later.');
}
```

### Type-safe implementation:
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
}

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Implementation with proper typing
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) return null;
  
  const data = await response.json();
  // TypeScript will ensure data conforms to UserProfile interface
  return data;
};
```