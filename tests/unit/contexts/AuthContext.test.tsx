/**
 * Comprehensive AuthContext tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '../../../src/test/test-helpers';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import * as api from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  api: {
    auth: {
      signIn: vi.fn(),
      signUp: vi.fn(), 
      signOut: vi.fn(),
      getUserProfile: vi.fn(),
      onAuthStateChange: vi.fn(),
    }
  }
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, role, isLoading, signIn, signUp, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="role">{role || 'No role'}</div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <button data-testid="signin" onClick={() => signIn({ email: 'test@example.com', password: 'password' })}>
        Sign In
      </button>
      <button data-testid="signup" onClick={() => signUp({ email: 'test@example.com', password: 'password', name: 'Test User' })}>
        Sign Up
      </button>
      <button data-testid="signout" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (api.api.auth.signIn as any).mockResolvedValue({ error: null });
    (api.api.auth.signUp as any).mockResolvedValue({ error: null });
    (api.api.auth.signOut as any).mockResolvedValue({ error: null });
    (api.api.auth.getUserProfile as any).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com', 
      name: 'Test User',
      role: 'customer'
    });
    (api.api.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      renderWithAuth();
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('role')).toHaveTextContent('No role');
    });

    it('should fetch user profile on mount', async () => {
      renderWithAuth();
      
      await waitFor(() => {
        expect(api.api.auth.getUserProfile).toHaveBeenCalled();
      });
    });
  });

  describe('Sign In Flow', () => {
    it('should handle successful sign in', async () => {
      renderWithAuth();
      
      const signInButton = screen.getByTestId('signin');
      
      await act(async () => {
        signInButton.click();
      });
      
      await waitFor(() => {
        expect(api.api.auth.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        });
      });
    });

    it('should handle sign in error', async () => {
      const mockError = new Error('Invalid credentials');
      (api.api.auth.signIn as any).mockResolvedValue({ error: mockError });
      
      renderWithAuth();
      
      const signInButton = screen.getByTestId('signin');
      
      await act(async () => {
        signInButton.click();
      });
      
      await waitFor(() => {
        expect(api.api.auth.signIn).toHaveBeenCalled();
      });
    });

    it('should handle storage quota exceeded error', async () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      (api.api.auth.signIn as any).mockRejectedValue(quotaError);
      
      renderWithAuth();
      
      const signInButton = screen.getByTestId('signin');
      
      await act(async () => {
        signInButton.click();
      });
      
      await waitFor(() => {
        expect(api.api.auth.signIn).toHaveBeenCalled();
      });
    });
  });

  describe('Sign Up Flow', () => {
    it('should handle successful sign up', async () => {
      renderWithAuth();
      
      const signUpButton = screen.getByTestId('signup');
      
      await act(async () => {
        signUpButton.click();
      });
      
      await waitFor(() => {
        expect(api.api.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User'
        });
      });
    });
  });

  describe('Sign Out Flow', () => {
    it('should handle successful sign out', async () => {
      renderWithAuth();
      
      const signOutButton = screen.getByTestId('signout');
      
      await act(async () => {
        signOutButton.click();
      });
      
      await waitFor(() => {
        expect(api.api.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should handle SIGNED_IN event', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          app_metadata: { role: 'customer' }
        }
      };

      let authCallback: unknown;
      (api.api.auth.onAuthStateChange as any).mockImplementation((callback: Event) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth();

      // Simulate SIGNED_IN event
      await act(async () => {
        if (authCallback) {
          authCallback('SIGNED_IN', mockSession);
        }
      });

      await waitFor(() => {
        expect(api.api.auth.getUserProfile).toHaveBeenCalled();
      });
    });

    it('should handle SIGNED_OUT event', async () => {
      let authCallback: unknown;
      (api.api.auth.onAuthStateChange as any).mockImplementation((callback: Event) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth();

      // Simulate SIGNED_OUT event
      await act(async () => {
        if (authCallback) {
          authCallback('SIGNED_OUT', null);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });

    it('should create fallback profile when getUserProfile fails', async () => {
      (api.api.auth.getUserProfile as any).mockRejectedValue(new Error('Profile fetch failed'));

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          app_metadata: { role: 'customer' }
        }
      };

      let authCallback: unknown;
      (api.api.auth.onAuthStateChange as any).mockImplementation((callback: Event) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth();

      // Simulate SIGNED_IN event with failed profile fetch
      await act(async () => {
        if (authCallback) {
          authCallback('SIGNED_IN', mockSession);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('role')).toHaveTextContent('customer');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getUserProfile timeout', async () => {
      // Mock a slow getUserProfile response
      (api.api.auth.getUserProfile as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 15000))
      );

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          app_metadata: { role: 'customer' }
        }
      };

      let authCallback: unknown;
      (api.api.auth.onAuthStateChange as any).mockImplementation((callback: Event) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth();

      await act(async () => {
        if (authCallback) {
          authCallback('SIGNED_IN', mockSession);
        }
      });

      // Should create fallback profile due to timeout
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      }, { timeout: 15000 });
    });
  });

  describe('Context Consumer Error', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Create a component that tries to use useAuth outside the provider
      const ComponentWithoutProvider = () => {
        try {
          useAuth();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">{(error as Error).message}</div>;
        }
      };

      render(<ComponentWithoutProvider />);
      expect(screen.getByTestId('error')).toHaveTextContent('useAuth must be used within an AuthProvider');
    });
  });
});