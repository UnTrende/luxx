/**
 * Barber API Module
 * Consolidated barber operations extracted from monolithic api.ts
 */

import { supabase } from './supabaseClient';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';

export interface Barber {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  rating: number;
  experience: number;
  imageUrl?: string;
  bio?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBarberRequest {
  name: string;
  email: string;
  specialties: string[];
  bio?: string;
  imageUrl?: string;
}

export interface BarberFilters {
  specialties?: string[];
  available?: boolean;
  minRating?: number;
}

export class BarberApi {
  /**
   * Get all barbers
   */
  async getBarbers(filters: BarberFilters = {}): Promise<Barber[]> {
    const startTime = performance.now();
    
    try {
      let query = supabase
        .from('barbers')
        .select('*')
        .order('name');

      // Apply filters
      if (filters.available !== undefined) {
        query = query.eq('is_available', filters.available);
      }
      
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query;

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get barbers', error, 'BarberApi');
        throw new Error(error.message || 'Failed to load barbers');
      }

      let filteredData = data || [];

      // Filter by specialties if provided
      if (filters.specialties && filters.specialties.length > 0) {
        filteredData = filteredData.filter(barber =>
          filters.specialties!.some(specialty => 
            barber.specialties.includes(specialty)
          )
        );
      }

      logger.debug('Barbers loaded', {
        count: filteredData.length,
        filters,
        duration
      }, 'BarberApi');

      return filteredData as Barber[];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers', duration, 500);
      throw error;
    }
  }

  /**
   * Get barber by ID
   */
  async getBarberById(id: string): Promise<Barber> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'get',
          barberId: id
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/detail', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get barber by ID', error, 'BarberApi');
        throw new Error(error.message || 'Barber not found');
      }

      logger.debug('Barber loaded by ID', { barberId: id, duration }, 'BarberApi');

      return data as Barber;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/detail', duration, 500);
      throw error;
    }
  }

  /**
   * Create new barber (admin)
   */
  async createBarber(request: CreateBarberRequest): Promise<Barber> {
    const startTime = performance.now();
    
    try {
      logger.info('Creating barber', {
        name: request.name,
        email: request.email,
        specialties: request.specialties
      }, 'BarberApi');

      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'create',
          data: request
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers', duration, error ? 500 : 201, JSON.stringify(request).length);

      if (error) {
        logger.error('Failed to create barber', error, 'BarberApi');
        throw new Error(error.message || 'Failed to create barber');
      }

      logger.info('Barber created successfully', {
        barberId: data.id,
        name: request.name,
        duration
      }, 'BarberApi');

      return data as Barber;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers', duration, 500);
      throw error;
    }
  }

  /**
   * Update barber (admin)
   */
  async updateBarber(id: string, updates: Partial<CreateBarberRequest>): Promise<Barber> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating barber', { barberId: id, updates }, 'BarberApi');

      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'update',
          barberId: id,
          data: updates
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/update', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update barber', error, 'BarberApi');
        throw new Error(error.message || 'Failed to update barber');
      }

      logger.info('Barber updated successfully', {
        barberId: id,
        duration
      }, 'BarberApi');

      return data as Barber;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/update', duration, 500);
      throw error;
    }
  }

  /**
   * Delete barber (admin)
   */
  async deleteBarber(id: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      logger.info('Deleting barber', { barberId: id }, 'BarberApi');

      const { error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'delete',
          barberId: id
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/delete', duration, error ? 500 : 204);

      if (error) {
        logger.error('Failed to delete barber', error, 'BarberApi');
        throw new Error(error.message || 'Failed to delete barber');
      }

      logger.info('Barber deleted successfully', { barberId: id, duration }, 'BarberApi');
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/delete', duration, 500);
      throw error;
    }
  }

  /**
   * Get barber's services
   */
  async getBarberServices(barberId: string): Promise<any[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'get-services',
          barberId
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/services', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get barber services', error, 'BarberApi');
        throw new Error(error.message || 'Failed to load barber services');
      }

      logger.debug('Barber services loaded', {
        barberId,
        serviceCount: data?.length || 0,
        duration
      }, 'BarberApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/services', duration, 500);
      throw error;
    }
  }

  /**
   * Update barber's services
   */
  async updateBarberServices(barberId: string, serviceIds: string[]): Promise<void> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating barber services', {
        barberId,
        serviceCount: serviceIds.length
      }, 'BarberApi');

      const { error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'update-services',
          barberId,
          data: { serviceIds }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/services/update', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update barber services', error, 'BarberApi');
        throw new Error(error.message || 'Failed to update barber services');
      }

      logger.info('Barber services updated', {
        barberId,
        serviceCount: serviceIds.length,
        duration
      }, 'BarberApi');
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/services/update', duration, 500);
      throw error;
    }
  }

  /**
   * Update barber availability
   */
  async updateAvailability(barberId: string, isAvailable: boolean): Promise<Barber> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating barber availability', {
        barberId,
        isAvailable
      }, 'BarberApi');

      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'update-availability',
          barberId,
          data: { isAvailable }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/availability', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update barber availability', error, 'BarberApi');
        throw new Error(error.message || 'Failed to update availability');
      }

      logger.info('Barber availability updated', {
        barberId,
        isAvailable,
        duration
      }, 'BarberApi');

      return data as Barber;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/availability', duration, 500);
      throw error;
    }
  }

  /**
   * Check if barber is available for specific time
   */
  async isBarberAvailable(barberId: string, date: string, time: string): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('barber-management', {
        body: {
          action: 'check-availability',
          barberId,
          data: { date, time }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/check-availability', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to check barber availability', error, 'BarberApi');
        return false;
      }

      return data?.isAvailable || false;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/barbers/check-availability', duration, 500);
      return false;
    }
  }

  /**
   * Search barbers by name or specialties
   */
  async searchBarbers(query: string): Promise<Barber[]> {
    const allBarbers = await this.getBarbers();
    const searchQuery = query.toLowerCase();

    return allBarbers.filter(barber =>
      barber.name.toLowerCase().includes(searchQuery) ||
      barber.specialties.some(specialty => 
        specialty.toLowerCase().includes(searchQuery)
      ) ||
      barber.bio?.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Get top-rated barbers
   */
  async getTopRatedBarbers(limit: number = 5): Promise<Barber[]> {
    const allBarbers = await this.getBarbers();
    
    return allBarbers
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Validate barber creation request
   */
  validateCreateBarberRequest(request: CreateBarberRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!request.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      errors.push('Valid email is required');
    }

    if (!request.specialties || request.specialties.length === 0) {
      errors.push('At least one specialty is required');
    }

    if (request.bio && request.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const barberApi = new BarberApi();
export default barberApi;