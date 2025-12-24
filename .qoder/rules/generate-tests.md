---
trigger: model_decision
description: "Generate unit tests following project standards"
---

# Model Decision Rule - Generate Unit Tests

When asked to generate unit tests, follow these guidelines:

## Testing Rules
1. UNIT TEST COVERAGE - All business logic functions MUST have unit tests covering normal and edge cases.
2. INTEGRATION TESTING - API endpoints MUST be tested with real database interactions.
3. SECURITY TESTING - Authentication bypass attempts MUST be tested regularly.
4. REGRESSION PREVENTION - Bug fixes MUST include tests to prevent recurrence.

## Test Structure
```typescript
describe('functionName', () => {
  beforeEach(() => {
    // Reset mocks and set up test environment
  });

  it('should handle normal case', () => {
    // Test normal operation
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should handle errors gracefully', () => {
    // Test error conditions
  });
});
```

## Example Test for API Service
```typescript
import { api } from '../services/api';

jest.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

describe('getAvailableSlots', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should include CSRF token in authenticated requests', async () => {
    // Mock CSRF token and session
    const mockToken = 'mock-csrf-token';
    (global as any).csrfToken = mockToken;
    
    (require('../services/supabaseClient').supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'mock-access-token' } }
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ['9:00 AM', '10:00 AM']
    });

    await api.getAvailableSlots('barber-123', '2025-12-25');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRF-Token': mockToken
        })
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    (require('../services/supabaseClient').supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'mock-access-token' } }
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'Function failed'
    });

    await expect(api.getAvailableSlots('barber-123', '2025-12-25'))
      .rejects
      .toThrow('Function get-available-slots failed: Function failed');
  });
});
```

## Example Test for Edge Function
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Mock the Supabase client
jest.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: jest.fn()
}));

// Mock the auth module
jest.mock('../_shared/auth.ts', () => ({
  authenticateUser: jest.fn()
}));

describe('get-available-slots', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key'
    };
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });

  it('should authenticate user before processing', async () => {
    const mockAuthenticateUser = require('../_shared/auth.ts').authenticateUser;
    mockAuthenticateUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'customer',
      name: 'Test User'
    });
    
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    const mockRequest = new Request('https://test.supabase.co/functions/v1/get-available-slots?barberId=barber-123&date=2025-12-25', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
        'X-CSRF-Token': 'mock-csrf-token'
      }
    });
    
    // Import the function
    const { default: handler } = await import('./index.ts');
    
    await handler(mockRequest);
    
    // Verify authentication was called
    expect(mockAuthenticateUser).toHaveBeenCalledWith(mockRequest);
  });

  it('should return 401 for missing authentication', async () => {
    const mockAuthenticateUser = require('../_shared/auth.ts').authenticateUser;
    mockAuthenticateUser.mockRejectedValue(new Error('Missing Authorization header'));
    
    const mockRequest = new Request('https://test.supabase.co/functions/v1/get-available-slots?barberId=barber-123&date=2025-12-25', {
      method: 'GET'
    });
    
    // Import the function
    const { default: handler } = await import('./index.ts');
    
    const response = await handler(mockRequest);
    const responseBody = await response.json();
    
    expect(response.status).toBe(401);
    expect(responseBody.error).toContain('Authentication failed');
  });
});
```