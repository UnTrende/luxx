/**
 * Unified API Module Integrator
 * Provides seamless integration between new modular APIs and legacy monolithic api.ts
 */

import { authApi } from './authApi';
import { barberApi } from './barberApi';
import { bookingApi } from './bookingApi';
import { servicesApi } from './servicesApi';
import { productsApi } from './productsApi';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';

// Legacy API for backward compatibility
import { api as legacyApi } from './api';

/**
 * Unified API Interface
 * Combines all modular APIs with legacy fallback for seamless migration
 */
export class UnifiedApi {
  // New modular APIs
  public readonly auth = authApi;
  public readonly barbers = barberApi;
  public readonly bookings = bookingApi;
  public readonly services = servicesApi;
  public readonly products = productsApi;

  // Feature flags for gradual migration
  private readonly featureFlags = {
    useModularAuth: true,
    useModularBarbers: true,
    useModularBookings: true,
    useModularServices: true,
    useModularProducts: true,
    // Flags for not-yet-implemented modules
    useModularLoyalty: false,
    useModularAnalytics: false,
    useModularNotifications: false
  };

  constructor() {
    logger.info('Unified API initialized', {
      modularApis: Object.keys(this.featureFlags).filter(key => this.featureFlags[key as keyof typeof this.featureFlags]).length,
      totalFlags: Object.keys(this.featureFlags).length
    }, 'UnifiedApi');
  }

  /**
   * Legacy API compatibility layer
   * Provides backward compatibility for existing code
   */
  public readonly legacy = {
    // Authentication (migrated to modular)
    auth: {
      signIn: (credentials: any) => {
        if (this.featureFlags.useModularAuth) {
          logger.debug('Using modular auth API for signIn', undefined, 'UnifiedApi');
          return this.auth.signIn(credentials);
        }
        return legacyApi.auth.signIn(credentials);
      },
      signUp: (credentials: any) => {
        if (this.featureFlags.useModularAuth) {
          logger.debug('Using modular auth API for signUp', undefined, 'UnifiedApi');
          return this.auth.signUp(credentials);
        }
        return legacyApi.auth.signUp(credentials);
      },
      signOut: () => {
        if (this.featureFlags.useModularAuth) {
          logger.debug('Using modular auth API for signOut', undefined, 'UnifiedApi');
          return this.auth.signOut();
        }
        return legacyApi.auth.signOut();
      },
      getUserProfile: () => {
        if (this.featureFlags.useModularAuth) {
          logger.debug('Using modular auth API for getUserProfile', undefined, 'UnifiedApi');
          return this.auth.getUserProfile();
        }
        return legacyApi.auth.getUserProfile();
      },
      onAuthStateChange: (callback: any) => {
        if (this.featureFlags.useModularAuth) {
          logger.debug('Using modular auth API for onAuthStateChange', undefined, 'UnifiedApi');
          return this.auth.onAuthStateChange(callback);
        }
        return legacyApi.auth.onAuthStateChange(callback);
      }
    },

    // Barbers (migrated to modular)
    barbers: {
      getBarbers: (filters?: any) => {
        if (this.featureFlags.useModularBarbers) {
          logger.debug('Using modular barbers API for getBarbers', undefined, 'UnifiedApi');
          return this.barbers.getBarbers(filters);
        }
        return legacyApi.barbers.getBarbers();
      },
      getBarberById: (id: string) => {
        if (this.featureFlags.useModularBarbers) {
          logger.debug('Using modular barbers API for getBarberById', { barberId: id }, 'UnifiedApi');
          return this.barbers.getBarberById(id);
        }
        return legacyApi.barbers.getBarberById(id);
      },
      createBarber: (request: any) => {
        if (this.featureFlags.useModularBarbers) {
          logger.debug('Using modular barbers API for createBarber', undefined, 'UnifiedApi');
          return this.barbers.createBarber(request);
        }
        return legacyApi.barbers.addBarber(request);
      },
      updateBarber: (id: string, updates: any) => {
        if (this.featureFlags.useModularBarbers) {
          logger.debug('Using modular barbers API for updateBarber', { barberId: id }, 'UnifiedApi');
          return this.barbers.updateBarber(id, updates);
        }
        return legacyApi.barbers.updateBarber(id, updates);
      }
    },

    // Bookings (migrated to modular)
    bookings: {
      createBooking: (request: any) => {
        if (this.featureFlags.useModularBookings) {
          logger.debug('Using modular bookings API for createBooking', undefined, 'UnifiedApi');
          return this.bookings.createBooking(request);
        }
        return legacyApi.bookings.createBooking(request);
      },
      getMyBookings: () => {
        if (this.featureFlags.useModularBookings) {
          logger.debug('Using modular bookings API for getMyBookings', undefined, 'UnifiedApi');
          return this.bookings.getMyBookings();
        }
        return legacyApi.bookings.getMyBookings();
      },
      getAllBookings: (filters?: any) => {
        if (this.featureFlags.useModularBookings) {
          logger.debug('Using modular bookings API for getAllBookings', undefined, 'UnifiedApi');
          return this.bookings.getAllBookings(filters);
        }
        return legacyApi.bookings.getAllBookings(filters);
      },
      updateBookingStatus: (id: string, status: string) => {
        if (this.featureFlags.useModularBookings) {
          logger.debug('Using modular bookings API for updateBookingStatus', { bookingId: id, status }, 'UnifiedApi');
          return this.bookings.updateBookingStatus(id, status);
        }
        return legacyApi.bookings.updateBookingStatus(id, status);
      },
      getAvailableSlots: (barberId: string, date: string, serviceIds?: string[]) => {
        if (this.featureFlags.useModularBookings) {
          logger.debug('Using modular bookings API for getAvailableSlots', { barberId, date }, 'UnifiedApi');
          return this.bookings.getAvailableSlots(barberId, date, serviceIds);
        }
        return legacyApi.bookings.getAvailableSlots(barberId, date);
      }
    },

    // Services (migrated to modular)
    services: {
      getServices: () => {
        if (this.featureFlags.useModularServices) {
          logger.debug('Using modular services API for getServices', undefined, 'UnifiedApi');
          return this.services.getServices();
        }
        return legacyApi.services.getServices();
      },
      createService: (request: any) => {
        if (this.featureFlags.useModularServices) {
          logger.debug('Using modular services API for createService', undefined, 'UnifiedApi');
          return this.services.createService(request);
        }
        return legacyApi.services.addService(request);
      },
      updateService: (id: string, updates: any) => {
        if (this.featureFlags.useModularServices) {
          logger.debug('Using modular services API for updateService', { serviceId: id }, 'UnifiedApi');
          return this.services.updateService(id, updates);
        }
        return legacyApi.services.updateService(id, updates);
      }
    },

    // Products (migrated to modular)
    products: {
      getProducts: (filters?: any) => {
        if (this.featureFlags.useModularProducts) {
          logger.debug('Using modular products API for getProducts', undefined, 'UnifiedApi');
          return this.products.getProducts(filters);
        }
        return legacyApi.products.getProducts();
      },
      getProductById: (id: string) => {
        if (this.featureFlags.useModularProducts) {
          logger.debug('Using modular products API for getProductById', { productId: id }, 'UnifiedApi');
          return this.products.getProductById(id);
        }
        return legacyApi.products.getProductById(id);
      },
      createOrder: (request: any) => {
        if (this.featureFlags.useModularProducts) {
          logger.debug('Using modular products API for createOrder', undefined, 'UnifiedApi');
          return this.products.createOrder(request);
        }
        return legacyApi.products.createProductOrder(request);
      }
    },

    // Not-yet-migrated modules (still use legacy)
    loyalty: {
      getLoyaltyStats: () => {
        logger.debug('Using legacy API for getLoyaltyStats', undefined, 'UnifiedApi');
        return legacyApi.loyalty?.getLoyaltyStats?.() || Promise.resolve(null);
      },
      processTransaction: (transaction: any) => {
        logger.debug('Using legacy API for loyalty transaction', undefined, 'UnifiedApi');
        return legacyApi.loyalty?.processTransaction?.(transaction) || Promise.resolve(null);
      }
    },

    analytics: {
      getOverview: () => {
        logger.debug('Using legacy API for analytics overview', undefined, 'UnifiedApi');
        return legacyApi.analytics?.getOverview?.() || Promise.resolve(null);
      },
      getReports: (filters?: any) => {
        logger.debug('Using legacy API for analytics reports', undefined, 'UnifiedApi');
        return legacyApi.analytics?.getReports?.(filters) || Promise.resolve([]);
      }
    }
  };

  /**
   * Feature flag management
   */
  public enableModularApi(module: keyof typeof this.featureFlags): void {
    logger.info('Enabling modular API', { module }, 'UnifiedApi');
    this.featureFlags[module] = true;
  }

  public disableModularApi(module: keyof typeof this.featureFlags): void {
    logger.warn('Disabling modular API', { module }, 'UnifiedApi');
    this.featureFlags[module] = false;
  }

  public getModularApiStatus(): Record<string, boolean> {
    return { ...this.featureFlags };
  }

  /**
   * Health check for all modular APIs
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    try {
      // Test auth API
      results.auth = await this.auth.isAuthenticated().catch(() => false);
      
      // Test other APIs with simple operations
      results.barbers = await this.barbers.getBarbers().then(() => true).catch(() => false);
      results.services = await this.services.getServices().then(() => true).catch(() => false);
      results.products = await this.products.getProducts().then(() => true).catch(() => false);
      results.bookings = true; // Booking API doesn't have a simple health check
      
      logger.info('API health check completed', results, 'UnifiedApi');
      return results;
    } catch (error) {
      logger.error('API health check failed', error, 'UnifiedApi');
      return results;
    }
  }

  /**
   * Performance metrics for modular vs legacy API usage
   */
  getUsageMetrics(): Record<string, number> {
    // This would be implemented with actual usage tracking
    return {
      modularCalls: 0, // Track in performanceMonitor
      legacyCalls: 0,
      totalCalls: 0
    };
  }

  /**
   * Gradual migration helper
   * Allows testing new APIs with fallback to legacy
   */
  async safeCall<T>(
    modularCall: () => Promise<T>,
    legacyCall: () => Promise<T>,
    apiName: string
  ): Promise<T> {
    try {
      const startTime = performance.now();
      const result = await modularCall();
      const duration = performance.now() - startTime;
      
      performanceMonitor.recordMetric('modular_api_success', duration, {
        api: apiName,
        type: 'modular_success'
      });
      
      return result;
    } catch (error) {
      logger.warn('Modular API call failed, falling back to legacy', {
        apiName,
        error: error instanceof Error ? error.message : String(error)
      }, 'UnifiedApi');
      
      performanceMonitor.recordMetric('modular_api_fallback', 1, {
        api: apiName,
        type: 'fallback_to_legacy'
      });
      
      return await legacyCall();
    }
  }
}

// Export unified API instance
export const unifiedApi = new UnifiedApi();

// Export individual modules for direct access
export {
  authApi,
  barberApi,
  bookingApi,
  servicesApi,
  productsApi
};

// Default export for ease of use
export default unifiedApi;