/**
 * Service Contract Definitions
 * Type-safe interfaces for inter-service communication
 */

// Base contract types
export interface ServiceContract {
  name: string;
  version: string;
  dependencies: string[];
  endpoints: Record<string, EndpointContract>;
  events: Record<string, EventContract>;
}

export interface EndpointContract {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requestSchema?: unknown;
  responseSchema?: unknown;
  authentication: boolean;
  rateLimit?: string;
  timeout?: number;
}

export interface EventContract {
  type: string;
  version: string;
  schema: unknown;
  async: boolean;
}

// Authentication Service Contract
export const AuthServiceContract: ServiceContract = {
  name: 'auth-service',
  version: '1.0.0',
  dependencies: ['database', 'cache'],
  endpoints: {
    login: {
      method: 'POST',
      path: '/auth/login',
      authentication: false,
      rateLimit: '10/15min',
      timeout: 5000
    },
    profile: {
      method: 'GET',
      path: '/auth/profile',
      authentication: true,
      timeout: 3000
    },
    refresh: {
      method: 'POST',
      path: '/auth/refresh',
      authentication: false,
      rateLimit: '30/hour'
    }
  },
  events: {
    userRegistered: {
      type: 'user.registered',
      version: '1.0',
      schema: 'UserRegisteredEvent',
      async: true
    },
    userLoggedIn: {
      type: 'user.logged_in',
      version: '1.0',
      schema: 'UserLoggedInEvent',
      async: true
    }
  }
};

// Barber Service Contract
export const BarberServiceContract: ServiceContract = {
  name: 'barber-service',
  version: '1.0.0',
  dependencies: ['database', 'auth-service'],
  endpoints: {
    listBarbers: {
      method: 'GET',
      path: '/barbers',
      authentication: false,
      timeout: 5000
    },
    getBarber: {
      method: 'GET',
      path: '/barbers/:id',
      authentication: false,
      timeout: 3000
    },
    createBarber: {
      method: 'POST',
      path: '/barbers',
      authentication: true,
      rateLimit: '10/hour'
    },
    getAvailability: {
      method: 'GET',
      path: '/barbers/:id/availability',
      authentication: false,
      timeout: 5000
    }
  },
  events: {
    barberCreated: {
      type: 'barber.created',
      version: '1.0',
      schema: 'BarberCreatedEvent',
      async: true
    },
    availabilityUpdated: {
      type: 'barber.availability_updated',
      version: '1.0',
      schema: 'AvailabilityUpdatedEvent',
      async: true
    }
  }
};

// Booking Service Contract
export const BookingServiceContract: ServiceContract = {
  name: 'booking-service',
  version: '1.0.0',
  dependencies: ['database', 'auth-service', 'barber-service', 'loyalty-service'],
  endpoints: {
    createBooking: {
      method: 'POST',
      path: '/bookings',
      authentication: true,
      timeout: 15000,
      rateLimit: '20/hour'
    },
    getBookings: {
      method: 'GET',
      path: '/bookings',
      authentication: true,
      timeout: 5000
    },
    getBooking: {
      method: 'GET',
      path: '/bookings/:id',
      authentication: true,
      timeout: 3000
    },
    updateStatus: {
      method: 'PATCH',
      path: '/bookings/:id/status',
      authentication: true,
      timeout: 10000
    },
    checkAvailability: {
      method: 'GET',
      path: '/availability',
      authentication: false,
      timeout: 5000
    }
  },
  events: {
    bookingCreated: {
      type: 'booking.created',
      version: '1.0',
      schema: 'BookingCreatedEvent',
      async: true
    },
    bookingCompleted: {
      type: 'booking.completed',
      version: '1.0',
      schema: 'BookingCompletedEvent',
      async: true
    },
    bookingCancelled: {
      type: 'booking.cancelled',
      version: '1.0',
      schema: 'BookingCancelledEvent',
      async: true
    }
  }
};

// Service Registry
export const ServiceRegistry = {
  'auth-service': AuthServiceContract,
  'barber-service': BarberServiceContract,
  'booking-service': BookingServiceContract
} as const;

// Contract validation utilities
export class ContractValidator {
  static validateRequest(serviceName: string, endpoint: string, request: any): boolean {
    const contract = ServiceRegistry[serviceName as keyof typeof ServiceRegistry];
    if (!contract) {
      throw new Error(`Service contract not found: ${serviceName}`);
    }

    const endpointContract = contract.endpoints[endpoint];
    if (!endpointContract) {
      throw new Error(`Endpoint contract not found: ${serviceName}.${endpoint}`);
    }

    // In a real implementation, this would validate against JSON schema
    return true;
  }

  static validateResponse(serviceName: string, endpoint: string, response: ApiResponse<unknown>): boolean {
    const contract = ServiceRegistry[serviceName as keyof typeof ServiceRegistry];
    if (!contract) {
      throw new Error(`Service contract not found: ${serviceName}`);
    }

    const endpointContract = contract.endpoints[endpoint];
    if (!endpointContract) {
      throw new Error(`Endpoint contract not found: ${serviceName}.${endpoint}`);
    }

    // Validate response follows API contract
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    if (typeof response.success !== 'boolean') {
      return false;
    }

    if (response.error && typeof response.error !== 'object') {
      return false;
    }

    return true;
  }
}

export default ServiceRegistry;