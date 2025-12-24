/**
 * Enhanced test helpers and utilities
 */
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { SettingsProvider } from '../../contexts/SettingsContext';

// Create a test-specific QueryClient with no retries and no cache persistence
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Don't cache data
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ children, queryClient = createTestQueryClient() }: AllTheProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient } = {}
) => {
  const { queryClient, ...renderOptions } = options;
  return render(ui, { 
    wrapper: (props) => <AllTheProviders queryClient={queryClient} {...props} />, 
    ...renderOptions 
  });
};

// Mock API responses
export const mockApiResponses = {
  auth: {
    signIn: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getUserProfile: jest.fn(() => Promise.resolve({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer'
    })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
  },
  
  barbers: {
    getBarbers: jest.fn(() => Promise.resolve([
      { id: '1', name: 'Test Barber', email: 'barber@example.com', specialties: ['haircut'] }
    ])),
    getBarberById: jest.fn(() => Promise.resolve({
      id: '1', name: 'Test Barber', email: 'barber@example.com', specialties: ['haircut']
    }))
  },

  bookings: {
    createBooking: jest.fn(() => Promise.resolve({ id: 'booking-1', status: 'confirmed' })),
    getMyBookings: jest.fn(() => Promise.resolve([])),
    cancelBooking: jest.fn(() => Promise.resolve({ success: true }))
  },

  services: {
    getServices: jest.fn(() => Promise.resolve([
      { id: '1', name: 'Haircut', price: 30, duration: 30 }
    ]))
  },

  products: {
    getProducts: jest.fn(() => Promise.resolve([
      { id: '1', name: 'Hair Gel', price: 15, in_stock: true }
    ]))
  }
};

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn()
  };
})();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };