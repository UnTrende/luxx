/**
 * Booking API Module
 * Consolidated booking operations extracted from monolithic api.ts
 */

import { supabase } from './supabaseClient';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';
import type { ApiResponse, BookingData } from '../types';

export interface CreateBookingRequest {
  barberId: string;
  serviceIds: string[];
  appointmentDate: string;
  appointmentTime: string;
  customerNotes?: string;
}

export interface BookingFilters {
  status?: string;
  barberId?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  duration: number;
}

export class BookingApi {
  private readonly functionTimeout = 15000; // 15 seconds for booking operations

  /**
   * Create a new booking
   */
  async createBooking(request: CreateBookingRequest): Promise<ApiResponse<BookingData>> {
    const startTime = performance.now();
    
    try {
      logger.info('Creating booking', {
        barberId: request.barberId,
        serviceCount: request.serviceIds.length,
        date: request.appointmentDate
      }, 'BookingApi');

      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'create',
          data: request
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to create booking', error, 'BookingApi');
        return {
          success: false,
          error: {
            code: 'BOOKING_CREATION_FAILED',
            message: error.message || 'Failed to create booking'
          }
        };
      }

      logger.info('Booking created successfully', {
        bookingId: data.id,
        duration
      }, 'BookingApi');

      return {
        success: true,
        data: data as BookingData
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings', duration, 500);
      
      logger.error('Booking creation error', error, 'BookingApi');
      throw error;
    }
  }

  /**
   * Get user's bookings
   */
  async getMyBookings(): Promise<BookingData[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'get-my-bookings'
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/my', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get user bookings', error, 'BookingApi');
        throw new Error(error.message || 'Failed to load bookings');
      }

      logger.debug('User bookings loaded', {
        count: data?.length || 0,
        duration
      }, 'BookingApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/my', duration, 500);
      throw error;
    }
  }

  /**
   * Get all bookings (admin)
   */
  async getAllBookings(filters: BookingFilters = {}): Promise<BookingData[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'get-all-bookings',
          data: filters
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/all', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get all bookings', error, 'BookingApi');
        throw new Error(error.message || 'Failed to load bookings');
      }

      logger.info('All bookings loaded', {
        count: data?.length || 0,
        filters,
        duration
      }, 'BookingApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/all', duration, 500);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string): Promise<BookingData> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating booking status', {
        bookingId,
        newStatus: status
      }, 'BookingApi');

      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'update-status',
          bookingId,
          data: { status }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/status', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update booking status', error, 'BookingApi');
        throw new Error(error.message || 'Failed to update booking status');
      }

      logger.info('Booking status updated', {
        bookingId,
        newStatus: status,
        duration
      }, 'BookingApi');

      return data as BookingData;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/status', duration, 500);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<BookingData> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  }

  /**
   * Get available time slots for a barber
   */
  async getAvailableSlots(barberId: string, date: string, serviceIds: string[] = []): Promise<AvailabilitySlot[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'get-available-slots',
          barberId,
          data: {
            date,
            serviceIds
          }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/availability', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get available slots', error, 'BookingApi');
        throw new Error(error.message || 'Failed to load availability');
      }

      logger.debug('Available slots loaded', {
        barberId,
        date,
        slotCount: data?.length || 0,
        duration
      }, 'BookingApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/availability', duration, 500);
      throw error;
    }
  }

  /**
   * Get booked slots for a barber (admin view)
   */
  async getBookedSlots(barberId: string, date: string): Promise<{ time: string; status: string }[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'get-booked-slots',
          barberId,
          data: { date }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/slots', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get booked slots', error, 'BookingApi');
        throw new Error(error.message || 'Failed to load booked slots');
      }

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/slots', duration, 500);
      throw error;
    }
  }

  /**
   * Get bookings for billing (admin)
   */
  async getBookingsForBilling(startDate?: string, endDate?: string): Promise<BookingData[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'get-for-billing',
          data: {
            startDate,
            endDate
          }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/billing', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get bookings for billing', error, 'BookingApi');
        throw new Error(error.message || 'Failed to load billing data');
      }

      logger.info('Billing bookings loaded', {
        count: data?.length || 0,
        dateRange: { startDate, endDate },
        duration
      }, 'BookingApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/billing', duration, 500);
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(barberId: string, date: string, time: string): Promise<boolean> {
    const slots = await this.getAvailableSlots(barberId, date);
    return slots.some(slot => slot.time === time && slot.available);
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<BookingData> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers:customer_id (id, name, email),
          barbers (id, name),
          booking_services (
            services (id, name, price, duration)
          )
        `)
        .eq('id', bookingId)
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/detail', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get booking by ID', error, 'BookingApi');
        throw new Error(error.message || 'Booking not found');
      }

      return data as BookingData;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/bookings/detail', duration, 500);
      throw error;
    }
  }

  /**
   * Validate booking request before submission
   */
  validateBookingRequest(request: CreateBookingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.barberId) {
      errors.push('Barber ID is required');
    }

    if (!request.serviceIds || request.serviceIds.length === 0) {
      errors.push('At least one service must be selected');
    }

    if (!request.appointmentDate) {
      errors.push('Appointment date is required');
    } else {
      const appointmentDate = new Date(request.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        errors.push('Appointment date cannot be in the past');
      }
    }

    if (!request.appointmentTime) {
      errors.push('Appointment time is required');
    }

    if (request.customerNotes && request.customerNotes.length > 500) {
      errors.push('Customer notes must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const bookingApi = new BookingApi();
export default bookingApi;