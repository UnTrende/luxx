/**
 * useAuth Hook Tests
 * Tests the authentication hook functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../../contexts/AuthContext';
import { createWrapper } from '../../test-utils';

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUserProfile: vi.fn(),
    },
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide authentication state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signOut');
  });

  it('should handle sign in', async () => {
    const { api } = require('../../../services/api');
    api.auth.signIn.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.signIn({ email: 'test@example.com', password: 'password' });
    });

    expect(api.auth.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('should handle sign out', async () => {
    const { api } = require('../../../services/api');
    api.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.signOut();
    });

    expect(api.auth.signOut).toHaveBeenCalled();
  });
});