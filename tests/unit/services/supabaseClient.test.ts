/**
 * Supabase Client Tests
 * Tests the core database client functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase, isSupabaseConfigured } from '../../../services/supabaseClient';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        list: vi.fn(),
      })),
    },
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should be properly configured', () => {
      expect(isSupabaseConfigured).toBe(true);
    });

    it('should export supabase client instance', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should support select operations', () => {
      const query = supabase.from('test_table').select('*');
      expect(query).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('test_table');
    });

    it('should support insert operations', () => {
      const query = supabase.from('test_table').insert({ name: 'test' });
      expect(query).toBeDefined();
    });

    it('should support update operations', () => {
      const query = supabase.from('test_table').update({ name: 'updated' }).eq('id', 1);
      expect(query).toBeDefined();
    });

    it('should support delete operations', () => {
      const query = supabase.from('test_table').delete().eq('id', 1);
      expect(query).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should support sign in', () => {
      expect(supabase.auth.signInWithPassword).toBeDefined();
    });

    it('should support sign up', () => {
      expect(supabase.auth.signUp).toBeDefined();
    });

    it('should support auth state changes', () => {
      expect(supabase.auth.onAuthStateChange).toBeDefined();
    });
  });

  describe('Storage', () => {
    it('should support file operations', () => {
      const storage = supabase.storage.from('test-bucket');
      expect(storage.upload).toBeDefined();
      expect(storage.download).toBeDefined();
    });
  });
});