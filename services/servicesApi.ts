/**
 * Services API Module
 * Consolidated service catalog operations
 */

import { supabase } from './supabaseClient';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  loyalty_points_bronze: number;
  loyalty_points_silver: number;
  loyalty_points_gold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  loyalty_points_bronze: number;
  loyalty_points_silver: number;
  loyalty_points_gold: number;
}

export class ServicesApi {
  /**
   * Get all services
   */
  async getServices(activeOnly: boolean = true): Promise<Service[]> {
    const startTime = performance.now();
    
    try {
      let query = supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get services', error, 'ServicesApi');
        throw new Error(error.message || 'Failed to load services');
      }

      logger.debug('Services loaded', { 
        count: data?.length || 0, 
        activeOnly,
        duration 
      }, 'ServicesApi');

      return data as Service[] || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services', duration, 500);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/detail', duration, error ? 404 : 200);

      if (error) {
        logger.error('Failed to get service by ID', error, 'ServicesApi');
        throw new Error(error.message || 'Service not found');
      }

      return data as Service;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/detail', duration, 500);
      throw error;
    }
  }

  /**
   * Create new service (admin)
   */
  async createService(request: CreateServiceRequest): Promise<Service> {
    const startTime = performance.now();
    
    try {
      logger.info('Creating service', { name: request.name, price: request.price }, 'ServicesApi');

      const { data, error } = await supabase
        .from('services')
        .insert({
          ...request,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services', duration, error ? 500 : 201);

      if (error) {
        logger.error('Failed to create service', error, 'ServicesApi');
        throw new Error(error.message || 'Failed to create service');
      }

      logger.info('Service created successfully', { 
        serviceId: data.id,
        name: request.name,
        duration 
      }, 'ServicesApi');

      return data as Service;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services', duration, 500);
      throw error;
    }
  }

  /**
   * Update service (admin)
   */
  async updateService(id: string, updates: Partial<CreateServiceRequest>): Promise<Service> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating service', { serviceId: id, updates }, 'ServicesApi');

      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/update', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update service', error, 'ServicesApi');
        throw new Error(error.message || 'Failed to update service');
      }

      logger.info('Service updated successfully', { serviceId: id, duration }, 'ServicesApi');

      return data as Service;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/update', duration, 500);
      throw error;
    }
  }

  /**
   * Delete service (admin)
   */
  async deleteService(id: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      logger.info('Deleting service', { serviceId: id }, 'ServicesApi');

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/delete', duration, error ? 500 : 204);

      if (error) {
        logger.error('Failed to delete service', error, 'ServicesApi');
        throw new Error(error.message || 'Failed to delete service');
      }

      logger.info('Service deleted successfully', { serviceId: id, duration }, 'ServicesApi');
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/services/delete', duration, 500);
      throw error;
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: string): Promise<Service[]> {
    const allServices = await this.getServices();
    return allServices.filter(service => service.category === category);
  }

  /**
   * Get all service categories
   */
  async getServiceCategories(): Promise<string[]> {
    const services = await this.getServices();
    const categories = [...new Set(services.map(service => service.category))];
    return categories.sort();
  }

  /**
   * Calculate total price for multiple services
   */
  calculateTotalPrice(serviceIds: string[], services: Service[]): number {
    return serviceIds.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  }

  /**
   * Calculate total duration for multiple services
   */
  calculateTotalDuration(serviceIds: string[], services: Service[]): number {
    return serviceIds.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.duration || 0);
    }, 0);
  }

  /**
   * Validate service creation request
   */
  validateCreateServiceRequest(request: CreateServiceRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length < 2) {
      errors.push('Service name must be at least 2 characters');
    }

    if (!request.description || request.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (!request.price || request.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!request.duration || request.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!request.category || request.category.trim().length < 2) {
      errors.push('Category is required');
    }

    if (request.loyalty_points_bronze < 0 || request.loyalty_points_silver < 0 || request.loyalty_points_gold < 0) {
      errors.push('Loyalty points cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const servicesApi = new ServicesApi();
export default servicesApi;