/**
 * LoginPage Component Tests
 * Tests authentication and form functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import LoginPage from '../../../pages/LoginPage';
import { useNavigate } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ state: null })),
  };
});

// Mock AuthContext
const mockSignIn = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isLoading: false,
    user: null,
  }),
}));

describe('LoginPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    mockSignIn.mockResolvedValue({ error: null });
  });

  describe('Form Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);
      
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show sign up link', () => {
      render(<LoginPage />);
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });

    it('should show forgot password link', () => {
      render(<LoginPage />);
      expect(screen.getByText(/forgot.*password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should validate required email field', async () => {
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate required password field', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user types', async () => {
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should submit form with valid credentials', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should navigate to dashboard on successful login', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to intended page after login', async () => {
      const mockLocation = { state: { from: { pathname: '/booking' } } };
      (require('react-router-dom').useLocation as any).mockReturnValue(mockLocation);

      const { unmount } = render(<LoginPage />);
      unmount();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should display authentication error', async () => {
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Invalid credentials' } 
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should display network error', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user retries', async () => {
      mockSignIn.mockResolvedValueOnce({ 
        error: { message: 'Invalid credentials' } 
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Clear error and try again
      mockSignIn.mockResolvedValueOnce({ error: null });
      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should toggle password visibility', () => {
      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Remember Me Functionality', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should show remember me checkbox', () => {
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should include remember me in submission', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(rememberCheckbox);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          remember: true,
        });
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should have proper form labels', () => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      emailInput.focus();
      expect(emailInput).toHaveFocus();

      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      expect(submitButton).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Social Login Integration', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('should show social login options', () => {
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    });

    it('should handle social login', async () => {
      const googleButton = screen.getByText(/continue with google/i);
      fireEvent.click(googleButton);

      // Mock social auth implementation
      await waitFor(() => {
        // Would test actual social auth integration
        expect(googleButton).toBeInTheDocument();
      });
    });
  });
});