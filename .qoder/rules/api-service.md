---
trigger: file_based
patterns: ["services/**/*.ts"]
---

# Specific Files Rules - Services API

This rule applies to files in the `services/` directory, particularly `api.ts`.

## API Service Standards

### Authenticated API Calls
All authenticated API calls MUST include CSRF tokens:

```typescript
// CORRECT - Always include CSRF token
const response = await fetch(`${supabaseUrl}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  },
  body: JSON.stringify(data)
});

// INCORRECT - Missing CSRF token
const response = await fetch(`${supabaseUrl}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### CSRF Token Management
```typescript
// Ensure CSRF Token is present before making authenticated calls
if (!csrfToken) {
  await fetchCSRFToken();
}
```

### Error Handling
API service functions MUST handle errors gracefully:
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
  throw new Error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
}
```

### Public vs Authenticated Functions
Maintain the distinction between public and authenticated functions:
- Public functions: `get-barbers`, `get-products`, `get-services`, `get-booked-slots`, `get-settings`
- Authenticated functions: All others require authentication and CSRF tokens

### Implementation Pattern
```typescript
const invoke = async <T>(functionName: string, body?: object): Promise<T> => {
  // ... setup code ...
  
  // Ensure CSRF Token is present for authenticated functions
  if (!csrfToken) {
    await fetchCSRFToken();
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include CSRF Token for all calls (even public ones for consistency)
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // ... rest of implementation ...
};
```