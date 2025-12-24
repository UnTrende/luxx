# LuxeCut Testing Guide & TDD Practices

## Overview

This guide establishes Test-Driven Development (TDD) practices and comprehensive testing strategies for the LuxeCut application. Following these practices ensures code quality, reliability, and maintainability.

## Testing Philosophy

### Test Pyramid Structure
```
    /\     End-to-End Tests (5%)
   /  \    Integration Tests (15%)
  /____\   Unit Tests (80%)
```

- **Unit Tests**: Fast, isolated, test single functions/components
- **Integration Tests**: Test component interactions and API integrations
- **End-to-End Tests**: Test complete user workflows

## TDD Workflow

### Red-Green-Refactor Cycle

1. **🔴 RED**: Write a failing test
2. **🟢 GREEN**: Write minimal code to make it pass
3. **🔵 REFACTOR**: Improve code while keeping tests green

### Example TDD Process

```typescript
// 1. RED: Write failing test
describe('BookingService', () => {
  it('should create a booking with valid data', async () => {
    const bookingData = {
      barberId: 'barber-123',
      serviceIds: ['service-1'],
      date: '2024-01-15',
      time: '10:00'
    };
    
    const result = await bookingService.createBooking(bookingData);
    
    expect(result.success).toBe(true);
    expect(result.booking.id).toBeDefined();
  });
});

// 2. GREEN: Implement minimal code
class BookingService {
  async createBooking(data: BookingData): Promise<BookingResult> {
    return {
      success: true,
      booking: { id: 'booking-123', ...data }
    };
  }
}

// 3. REFACTOR: Add validation, error handling, etc.
```

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
describe('Component/Service Name', () => {
  beforeEach(() => {
    // ARRANGE: Setup test environment
  });

  it('should [expected behavior] when [condition]', () => {
    // ARRANGE: Prepare test data
    const testData = createTestData();
    
    // ACT: Execute the code under test
    const result = functionUnderTest(testData);
    
    // ASSERT: Verify the outcome
    expect(result).toEqual(expectedResult);
  });
});
```

### Test Naming Convention

- **Unit Tests**: `ComponentName.test.tsx` or `functionName.test.ts`
- **Integration Tests**: `ComponentName.integration.test.tsx`
- **E2E Tests**: `workflow-name.e2e.test.ts`

### Test Categories

#### 1. Unit Tests
- **Components**: Rendering, props, user interactions
- **Hooks**: State changes, side effects
- **Utils**: Pure functions, validation logic
- **Services**: API calls, business logic

#### 2. Integration Tests
- **API Integration**: Real API calls with test database
- **Component Integration**: Multiple components working together
- **State Management**: Context providers and consumers

#### 3. End-to-End Tests
- **User Workflows**: Complete booking flow, admin operations
- **Cross-browser**: Compatibility testing
- **Performance**: Load times, responsiveness

## Testing Tools & Configuration

### Primary Stack
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Mocking**: Vitest mocks
- **Coverage**: v8 provider
- **E2E**: Playwright (to be added)

### Test Utilities

```typescript
// Test helper for common setup
export const renderWithProviders = (
  component: ReactElement,
  options: RenderOptions = {}
) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          {component}
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>,
    options
  );
};

// Mock factory for API responses
export const createMockApiResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  success: true,
  error: null
});
```

## Test Coverage Requirements

### Coverage Targets
- **Overall**: 70% minimum
- **Critical Paths**: 90% (auth, bookings, payments)
- **New Features**: 80% before merge
- **Bug Fixes**: Include regression test

### Coverage by Type
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  }
});
```

## Component Testing Patterns

### React Component Tests

```typescript
// BookingForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingForm } from './BookingForm';
import { mockApiResponses } from '../test/helpers';

describe('BookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<BookingForm barberId="123" onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select services/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const onSubmit = vi.fn();
    render(<BookingForm barberId="123" onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### Hook Testing

```typescript
// useBooking.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useBooking } from './useBooking';
import { createWrapper } from '../test/helpers';

describe('useBooking', () => {
  it('should create booking successfully', async () => {
    const { result } = renderHook(() => useBooking(), {
      wrapper: createWrapper()
    });
    
    const bookingData = {
      barberId: 'barber-123',
      serviceIds: ['service-1'],
      date: '2024-01-15',
      time: '10:00'
    };
    
    await waitFor(() => {
      result.current.createBooking(bookingData);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.booking).toBeDefined();
  });
});
```

## API Testing Patterns

### Mock API Responses

```typescript
// api.test.ts
import { vi } from 'vitest';
import { api } from './api';

// Mock Supabase
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    }))
  }
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch barbers successfully', async () => {
    const mockBarbers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ];
    
    const result = await api.barbers.getBarbers();
    
    expect(result).toEqual(mockBarbers);
    expect(supabase.from).toHaveBeenCalledWith('barbers');
  });
});
```

## Performance Testing

### Component Performance

```typescript
// Performance test example
import { performanceMonitor } from '../lib/performance';

describe('BookingForm Performance', () => {
  it('should render within performance budget', async () => {
    const startTime = performance.now();
    
    render(<BookingForm barberId="123" />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(16); // 60fps budget
  });
  
  it('should not cause memory leaks', () => {
    const { unmount } = render(<BookingForm barberId="123" />);
    
    // Simulate component usage
    fireEvent.click(screen.getByRole('button'));
    
    unmount();
    
    // Check for cleanup
    expect(document.querySelectorAll('[data-testid]')).toHaveLength(0);
  });
});
```

## Edge Function Testing

### Testing Supabase Functions

```typescript
// functions/create-booking/test.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

Deno.test('create-booking function', async () => {
  const request = new Request('http://localhost:3000', {
    method: 'POST',
    body: JSON.stringify({
      barberId: 'barber-123',
      serviceIds: ['service-1'],
      date: '2024-01-15',
      time: '10:00'
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  });
  
  const response = await serve(request);
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.success, true);
  assertEquals(typeof data.booking.id, 'string');
});
```

## Test Data Management

### Test Fixtures

```typescript
// test/fixtures/index.ts
export const testBarber: Barber = {
  id: 'barber-test-123',
  name: 'Test Barber',
  email: 'barber@test.com',
  specialties: ['haircut', 'beard'],
  rating: 4.8,
  experience: 5
};

export const testBooking: Booking = {
  id: 'booking-test-123',
  barberId: testBarber.id,
  userId: 'user-test-123',
  serviceIds: ['service-test-1'],
  date: '2024-01-15',
  time: '10:00',
  status: 'confirmed'
};

// Test data factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer',
  ...overrides
});
```

## Continuous Integration

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests
npm test -- --run

# Check coverage
npm run test:coverage

# Type checking
npm run type-check
```

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### Do's ✅
- Write tests before implementation (TDD)
- Test behavior, not implementation
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Test error conditions
- Maintain test fixtures
- Regular test review and cleanup

### Don'ts ❌
- Test implementation details
- Write tests that depend on each other
- Mock everything (test real interactions where possible)
- Ignore flaky tests
- Skip edge cases
- Hardcode test data
- Test private methods directly

## Testing Metrics

### Track These Metrics
- **Coverage Percentage**: Overall and per-module
- **Test Execution Time**: Keep under 30 seconds for unit tests
- **Flaky Test Rate**: Target < 1%
- **Test Maintenance Cost**: Time spent fixing tests vs. features

### Review Process
- **Weekly**: Review test coverage reports
- **Monthly**: Identify and fix flaky tests
- **Quarterly**: Refactor test utilities and patterns

## Getting Started Checklist

- [ ] Set up test environment (`npm run test`)
- [ ] Write your first test using TDD
- [ ] Achieve 70% coverage on new code
- [ ] Set up pre-commit hooks
- [ ] Configure CI/CD pipeline
- [ ] Review and practice testing patterns
- [ ] Join testing culture discussions

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [TDD Best Practices](https://testdriven.io/blog/modern-tdd/)
- [Component Testing Strategies](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)

---

**Remember**: Good tests are an investment in code quality and developer confidence. Write tests that you and your team can trust and maintain.