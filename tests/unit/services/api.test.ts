/**
 * API service tests - Critical business logic
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../../../services/api';

// Mock supabase client
const mockSupabase = {
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
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock('../../../services/supabaseClient', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true,
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await api.auth.signIn({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign in error', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await api.auth.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBe(mockError);
    });

    it('should sign up user successfully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '1' }, session: {} },
        error: null,
      });

      const result = await api.auth.signUp({
        email: 'new@example.com',
        password: 'password',
        name: 'New User',
      });

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: {
          data: { name: 'New User' },
        },
      });
    });
  });

  describe('Barbers', () => {
    it('should fetch barbers successfully', async () => {
      const mockBarbers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ];

      mockSupabase.from().select.mockResolvedValue({
        data: mockBarbers,
        error: null,
      });

      const result = await api.barbers.getBarbers();

      expect(result).toEqual(mockBarbers);
      expect(mockSupabase.from).toHaveBeenCalledWith('barbers');
    });

    it('should handle barbers fetch error', async () => {
      const mockError = new Error('Database connection failed');
      mockSupabase.from().select.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(api.barbers.getBarbers()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Bookings', () => {
    it('should create booking successfully', async () => {
      const mockBooking = {
        id: 'booking-1',
        barber_id: 'barber-1',
        service_id: 'service-1',
        appointment_date: '2024-01-01',
        appointment_time: '10:00',
        status: 'confirmed',
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockBooking,
        error: null,
      });

      const result = await api.bookings.createBooking({
        barberId: 'barber-1',
        serviceId: 'service-1',
        date: '2024-01-01',
        time: '10:00',
      });

      expect(result).toEqual(mockBooking);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-booking', {
        body: {
          barberId: 'barber-1',
          serviceId: 'service-1',
          date: '2024-01-01',
          time: '10:00',
        },
      });
    });

    it('should handle booking creation error', async () => {
      const mockError = new Error('Time slot not available');
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(api.bookings.createBooking({
        barberId: 'barber-1',
        serviceId: 'service-1',
        date: '2024-01-01',
        time: '10:00',
      })).rejects.toThrow('Time slot not available');
    });
  });

  describe('Services', () => {
    it('should fetch services successfully', async () => {
      const mockServices = [
        { id: '1', name: 'Haircut', price: 30, duration: 30 },
        { id: '2', name: 'Beard Trim', price: 15, duration: 15 },
      ];

      mockSupabase.from().select.mockResolvedValue({
        data: mockServices,
        error: null,
      });

      const result = await api.services.getServices();

      expect(result).toEqual(mockServices);
      expect(mockSupabase.from).toHaveBeenCalledWith('services');
    });
  });

  describe('CSRF Protection', () => {
    it('should fetch CSRF token', async () => {
      const mockToken = 'csrf-token-123';
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { token: mockToken },
        error: null,
      });

      await api.fetchCSRFToken();

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-csrf-token');
    });

    it('should include CSRF token in requests', () => {
      // Test that CSRF token is included in request headers
      const headers = api.getRequestHeaders();
      expect(headers).toHaveProperty('X-CSRF-Token');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.from().select.mockRejectedValue(new Error('Network error'));

      await expect(api.barbers.getBarbers()).rejects.toThrow('Network error');
    });

    it('should handle rate limiting', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      await expect(api.bookings.createBooking({
        barberId: 'barber-1',
        serviceId: 'service-1',
        date: '2024-01-01',
        time: '10:00',
      })).rejects.toThrow('Rate limit exceeded');
    });
  });
});