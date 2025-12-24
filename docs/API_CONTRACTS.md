# LuxeCut API Contracts & Service Boundaries

## Overview

This document defines the API contracts, service boundaries, and governance policies for the LuxeCut microservices architecture. It establishes clear interfaces between services and ensures consistent communication patterns.

## Service Architecture

### Domain-Driven Service Boundaries

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Auth Service  │  │ Barber Service  │  │Booking Service  │
│                 │  │                 │  │                 │
│ • Authentication│  │ • Barber CRUD   │  │ • Scheduling    │
│ • Authorization │  │ • Availability  │  │ • Reservations  │
│ • User Sessions │  │ • Services      │  │ • Cancellations │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│Product Service  │  │ Loyalty Service │  │Analytics Service│
│                 │  │                 │  │                 │
│ • Inventory     │  │ • Points System │  │ • Reporting     │
│ • Orders        │  │ • Tier Management│  │ • Metrics       │
│ • Catalog       │  │ • Rewards       │  │ • Insights      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## API Contract Standards

### RESTful API Guidelines

#### HTTP Methods & Status Codes

| Method | Usage | Success Codes | Error Codes |
|--------|-------|---------------|-------------|
| `GET` | Retrieve resources | 200, 206 | 404, 403, 500 |
| `POST` | Create resources | 201 | 400, 409, 422, 500 |
| `PUT` | Update/Replace | 200, 204 | 400, 404, 422, 500 |
| `PATCH` | Partial Update | 200, 204 | 400, 404, 422, 500 |
| `DELETE` | Remove resources | 200, 204, 202 | 404, 409, 500 |

#### Standard Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

## Service Contracts

### 1. Authentication Service

#### Endpoints

```typescript
// Authentication Service API Contract
interface AuthService {
  // User Authentication
  POST /api/auth/login: {
    body: { email: string; password: string };
    response: ApiResponse<{
      user: UserProfile;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>;
  };

  POST /api/auth/logout: {
    headers: { Authorization: string };
    response: ApiResponse<{}>;
  };

  POST /api/auth/refresh: {
    body: { refreshToken: string };
    response: ApiResponse<{
      accessToken: string;
      expiresIn: number;
    }>;
  };

  // User Registration
  POST /api/auth/register: {
    body: {
      email: string;
      password: string;
      name: string;
      role?: 'customer' | 'barber' | 'admin';
    };
    response: ApiResponse<UserProfile>;
  };

  // Profile Management
  GET /api/auth/profile: {
    headers: { Authorization: string };
    response: ApiResponse<UserProfile>;
  };

  PUT /api/auth/profile: {
    headers: { Authorization: string };
    body: Partial<UserProfile>;
    response: ApiResponse<UserProfile>;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences?: Record<string, unknown>;
}
```

#### Service Contract

```typescript
interface AuthServiceContract {
  // Dependencies
  dependencies: {
    database: 'postgresql';
    cache: 'redis';
    email: 'smtp';
  };

  // Security Requirements
  security: {
    encryption: 'bcrypt';
    tokenType: 'JWT';
    tokenExpiry: '1h';
    refreshTokenExpiry: '30d';
    rateLimiting: '10 requests/minute';
  };

  // Data Ownership
  dataOwnership: {
    owns: ['users', 'sessions', 'auth_tokens'];
    reads: [];
    writes: ['users'];
  };

  // Events Published
  events: {
    'user.registered': UserRegisteredEvent;
    'user.logged_in': UserLoggedInEvent;
    'user.logged_out': UserLoggedOutEvent;
    'user.profile_updated': UserProfileUpdatedEvent;
  };
}
```

### 2. Barber Service

#### Endpoints

```typescript
interface BarberService {
  // Barber Management
  GET /api/barbers: {
    query?: {
      page?: number;
      limit?: number;
      specialties?: string[];
      available?: boolean;
    };
    response: PaginatedResponse<Barber>;
  };

  GET /api/barbers/{id}: {
    params: { id: string };
    response: ApiResponse<BarberDetails>;
  };

  POST /api/barbers: {
    headers: { Authorization: string };
    body: CreateBarberRequest;
    response: ApiResponse<Barber>;
  };

  PUT /api/barbers/{id}: {
    headers: { Authorization: string };
    params: { id: string };
    body: UpdateBarberRequest;
    response: ApiResponse<Barber>;
  };

  // Barber Availability
  GET /api/barbers/{id}/availability: {
    params: { id: string };
    query: { date: string; duration?: number };
    response: ApiResponse<AvailabilitySlot[]>;
  };

  PUT /api/barbers/{id}/availability: {
    headers: { Authorization: string };
    params: { id: string };
    body: { schedule: WeeklySchedule };
    response: ApiResponse<{}>;
  };

  // Barber Services
  GET /api/barbers/{id}/services: {
    params: { id: string };
    response: ApiResponse<BarberService[]>;
  };

  PUT /api/barbers/{id}/services: {
    headers: { Authorization: string };
    params: { id: string };
    body: { serviceIds: string[] };
    response: ApiResponse<{}>;
  };
}

interface Barber {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  rating: number;
  experience: number;
  isAvailable: boolean;
  imageUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface BarberDetails extends Barber {
  services: Service[];
  schedule: WeeklySchedule;
  reviews: Review[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
  };
}
```

### 3. Booking Service

#### Endpoints

```typescript
interface BookingService {
  // Booking Management
  POST /api/bookings: {
    headers: { Authorization: string };
    body: CreateBookingRequest;
    response: ApiResponse<Booking>;
  };

  GET /api/bookings: {
    headers: { Authorization: string };
    query?: {
      status?: BookingStatus;
      barberId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    };
    response: PaginatedResponse<Booking>;
  };

  GET /api/bookings/{id}: {
    headers: { Authorization: string };
    params: { id: string };
    response: ApiResponse<BookingDetails>;
  };

  PATCH /api/bookings/{id}/status: {
    headers: { Authorization: string };
    params: { id: string };
    body: { status: BookingStatus; reason?: string };
    response: ApiResponse<Booking>;
  };

  DELETE /api/bookings/{id}: {
    headers: { Authorization: string };
    params: { id: string };
    response: ApiResponse<{}>;
  };

  // Availability Check
  GET /api/availability: {
    query: {
      barberId: string;
      date: string;
      serviceIds: string[];
    };
    response: ApiResponse<AvailabilitySlot[]>;
  };
}

interface Booking {
  id: string;
  customerId: string;
  barberId: string;
  serviceIds: string[];
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  totalPrice: number;
  totalDuration: number;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';
```

### 4. Product Service

#### Endpoints

```typescript
interface ProductService {
  // Product Catalog
  GET /api/products: {
    query?: {
      category?: string;
      inStock?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    };
    response: PaginatedResponse<Product>;
  };

  GET /api/products/{id}: {
    params: { id: string };
    response: ApiResponse<ProductDetails>;
  };

  // Order Management
  POST /api/orders: {
    headers: { Authorization: string };
    body: CreateOrderRequest;
    response: ApiResponse<Order>;
  };

  GET /api/orders: {
    headers: { Authorization: string };
    query?: {
      status?: OrderStatus;
      startDate?: string;
      endDate?: string;
    };
    response: PaginatedResponse<Order>;
  };

  GET /api/orders/{id}: {
    headers: { Authorization: string };
    params: { id: string };
    response: ApiResponse<OrderDetails>;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  stockQuantity: number;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 5. Loyalty Service

#### Endpoints

```typescript
interface LoyaltyService {
  // Customer Loyalty
  GET /api/loyalty/profile: {
    headers: { Authorization: string };
    response: ApiResponse<LoyaltyProfile>;
  };

  GET /api/loyalty/history: {
    headers: { Authorization: string };
    query?: { page?: number; limit?: number };
    response: PaginatedResponse<LoyaltyTransaction>;
  };

  POST /api/loyalty/redeem: {
    headers: { Authorization: string };
    body: RedeemPointsRequest;
    response: ApiResponse<RedemptionResult>;
  };

  // Loyalty Administration
  GET /api/loyalty/settings: {
    headers: { Authorization: string };
    response: ApiResponse<LoyaltySettings>;
  };

  PUT /api/loyalty/settings: {
    headers: { Authorization: string };
    body: Partial<LoyaltySettings>;
    response: ApiResponse<LoyaltySettings>;
  };
}

interface LoyaltyProfile {
  customerId: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
  expiringPoints: {
    amount: number;
    expiryDate: string;
  };
}
```

## Service Communication Patterns

### 1. Synchronous Communication

#### HTTP REST APIs
- **Use Case**: Real-time user interactions
- **Pattern**: Direct API calls
- **Retry Policy**: 3 attempts with exponential backoff
- **Timeout**: 5 seconds for user-facing, 10 seconds for internal

```typescript
// Example: Booking Service calling Barber Service
class BookingService {
  async createBooking(request: CreateBookingRequest): Promise<Booking> {
    // 1. Validate availability
    const availability = await this.barberService.checkAvailability({
      barberId: request.barberId,
      date: request.date,
      time: request.time,
      duration: request.estimatedDuration
    });
    
    if (!availability.isAvailable) {
      throw new ConflictError('Time slot not available');
    }
    
    // 2. Create booking
    const booking = await this.repository.create(request);
    
    // 3. Reserve slot
    await this.barberService.reserveSlot({
      barberId: request.barberId,
      date: request.date,
      time: request.time,
      bookingId: booking.id
    });
    
    return booking;
  }
}
```

### 2. Asynchronous Communication

#### Event-Driven Architecture
- **Use Case**: Cross-service updates, notifications
- **Pattern**: Publish/Subscribe with message queues
- **Delivery**: At-least-once with idempotency

```typescript
// Event Types
interface BookingCreatedEvent {
  type: 'booking.created';
  version: '1.0';
  timestamp: string;
  data: {
    bookingId: string;
    customerId: string;
    barberId: string;
    appointmentDateTime: string;
    services: ServiceInfo[];
    totalAmount: number;
  };
}

// Event Handlers
class LoyaltyService {
  @EventHandler('booking.completed')
  async handleBookingCompleted(event: BookingCompletedEvent) {
    const points = this.calculatePoints(event.data.services, event.data.customerId);
    
    await this.awardPoints({
      customerId: event.data.customerId,
      points,
      reason: `Booking completed: ${event.data.bookingId}`,
      transactionType: 'earned'
    });
  }
}
```

## API Governance Policies

### 1. Versioning Strategy

#### Semantic Versioning
- **Format**: `/api/v{major}/{resource}`
- **Breaking Changes**: New major version
- **Backward Compatibility**: Maintain for 2 major versions
- **Deprecation Notice**: 6 months minimum

```typescript
// Version Management
interface ApiVersion {
  version: string;
  deprecated?: {
    date: string;
    sunset: string;
    migration: string;
  };
  changes: ChangeLog[];
}

// Example versioning
const API_VERSIONS = {
  'v1': {
    version: '1.2.3',
    deprecated: {
      date: '2024-06-01',
      sunset: '2024-12-01',
      migration: '/docs/migration/v1-to-v2'
    }
  },
  'v2': {
    version: '2.0.0',
    current: true
  }
};
```

### 2. Security Standards

#### Authentication & Authorization

```typescript
interface SecurityPolicy {
  authentication: {
    method: 'JWT';
    issuer: 'auth-service';
    audience: 'luxecut-api';
    algorithm: 'RS256';
    keyRotation: '30 days';
  };
  
  authorization: {
    model: 'RBAC'; // Role-Based Access Control
    roles: ['customer', 'barber', 'admin'];
    permissions: Permission[];
  };
  
  rateLimiting: {
    global: '1000 requests/hour';
    perUser: '100 requests/hour';
    perEndpoint: {
      '/api/auth/login': '10 requests/15min';
      '/api/bookings': '60 requests/hour';
    };
  };
}
```

#### Input Validation

```typescript
interface ValidationPolicy {
  request: {
    maxSize: '10MB';
    timeout: '30s';
    sanitization: true;
    schemaValidation: true;
  };
  
  response: {
    sanitization: true;
    compression: true;
    caching: {
      public: ['GET /api/services', 'GET /api/products'];
      private: ['GET /api/bookings', 'GET /api/profile'];
      ttl: '5 minutes';
    };
  };
}
```

### 3. Error Handling Standards

#### Standard Error Response

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
  path: string;
}

// Error Codes Convention
const ERROR_CODES = {
  // Authentication (AUTH_*)
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Validation (VAL_*)
  VAL_REQUIRED_FIELD: 'VAL_001',
  VAL_INVALID_FORMAT: 'VAL_002',
  VAL_OUT_OF_RANGE: 'VAL_003',
  
  // Business Logic (BIZ_*)
  BIZ_BOOKING_CONFLICT: 'BIZ_001',
  BIZ_INSUFFICIENT_STOCK: 'BIZ_002',
  BIZ_SERVICE_UNAVAILABLE: 'BIZ_003',
  
  // System (SYS_*)
  SYS_DATABASE_ERROR: 'SYS_001',
  SYS_EXTERNAL_API_ERROR: 'SYS_002',
  SYS_RATE_LIMIT_EXCEEDED: 'SYS_003'
};
```

### 4. Monitoring & Observability

#### Service Level Objectives (SLOs)

```typescript
interface ServiceLevelObjectives {
  availability: '99.9%'; // 8.76 hours downtime/year
  latency: {
    p50: '200ms';
    p95: '500ms';
    p99: '1000ms';
  };
  errorRate: '<0.1%';
  throughput: '1000 requests/second';
}

// Monitoring Requirements
interface MonitoringRequirements {
  metrics: [
    'request_duration_seconds',
    'request_total',
    'error_total',
    'database_connection_pool_size',
    'memory_usage_bytes',
    'cpu_usage_percent'
  ];
  
  alerts: {
    errorRate: '>1%';
    latency: 'p95 > 1s';
    availability: '<99%';
    cpuUsage: '>80%';
    memoryUsage: '>85%';
  };
  
  logging: {
    level: 'info';
    format: 'structured_json';
    retention: '30 days';
    sampling: '100% for errors, 10% for info';
  };
}
```

## Service Dependencies & Communication Matrix

```
Service Dependencies Matrix:

         │ Auth │ Barber │ Booking │ Product │ Loyalty │ Analytics
─────────┼──────┼────────┼─────────┼─────────┼─────────┼──────────
Auth     │  -   │   ✓    │    ✓    │    ✓    │    ✓    │     ✓
Barber   │  ✓   │   -    │    ✗    │    ✗    │    ✗    │     ✗
Booking  │  ✓   │   ✓    │    -    │    ✗    │    →    │     →
Product  │  ✓   │   ✗    │    ✗    │    -    │    →    │     →
Loyalty  │  ✓   │   ✗    │    ✗    │    ✗    │    -    │     →
Analytics│  ✓   │   ✓    │    ✓    │    ✓    │    ✓    │     -

Legend: ✓ = Synchronous, → = Asynchronous, ✗ = No direct dependency
```

## Implementation Guidelines

### 1. Service Development Checklist

- [ ] **API Contract Defined**: OpenAPI specification created
- [ ] **Security Implemented**: Authentication, authorization, rate limiting
- [ ] **Validation Added**: Input/output validation with clear error messages
- [ ] **Testing Complete**: Unit, integration, and contract tests
- [ ] **Monitoring Setup**: Metrics, logging, health checks
- [ ] **Documentation Updated**: API docs, deployment guides
- [ ] **Performance Tested**: Load testing completed
- [ ] **Error Handling**: Comprehensive error scenarios covered

### 2. API Design Principles

- **Consistency**: Follow established patterns and conventions
- **Discoverability**: Clear resource naming and relationships
- **Flexibility**: Support for filtering, sorting, and pagination
- **Security**: Defense in depth approach
- **Performance**: Optimize for common use cases
- **Maintainability**: Clear separation of concerns
- **Reliability**: Graceful degradation and error recovery

### 3. Change Management Process

1. **Proposal**: RFC (Request for Comments) for significant changes
2. **Review**: Architecture and security review
3. **Testing**: Contract tests and backward compatibility verification
4. **Staging**: Deploy to staging environment for integration testing
5. **Documentation**: Update API documentation and migration guides
6. **Production**: Gradual rollout with monitoring
7. **Deprecation**: Proper sunset timeline for old versions

---

This API contract framework ensures consistent, secure, and maintainable service communication across the LuxeCut platform while supporting future growth and evolution.