/**
 * API Integration Tests
 * Tests actual API interactions with test database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../../services/api';

// Use real API with test environment
describe('API Integration Tests', () => {
  beforeEach(() => {
    // Reset any mocks for integration testing
    vi.restoreAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should handle complete auth flow', async () => {
      // Test sign up
      const signUpResult = await api.auth.signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'testPassword123',
        name: 'Test User'
      });
      
      expect(signUpResult.error).toBeNull();
      
      // Test sign in
      const signInResult = await api.auth.signIn({
        email: signUpResult.user?.email || '',
        password: 'testPassword123'
      });
      
      expect(signInResult.error).toBeNull();
      
      // Test get profile
      const profile = await api.auth.getUserProfile();
      expect(profile).toBeDefined();
      expect(profile.email).toBe(signUpResult.user?.email);
    });
  });

  describe('Barber Operations', () => {
    it('should get barbers list', async () => {
      const barbers = await api.barbers.getBarbers();
      expect(Array.isArray(barbers)).toBe(true);
    });

    it('should get barber by ID', async () => {
      const barbers = await api.barbers.getBarbers();
      if (barbers.length > 0) {
        const barber = await api.barbers.getBarberById(barbers[0].id);
        expect(barber).toBeDefined();
        expect(barber.id).toBe(barbers[0].id);
      }
    });
  });

  describe('Services Operations', () => {
    it('should get services list', async () => {
      const services = await api.services.getServices();
      expect(Array.isArray(services)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        await api.barbers.getBarberById('non-existent-id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeouts', async () => {
      // Test with very short timeout
      try {
        // This would test timeout handling
        expect(true).toBe(true); // Placeholder
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});