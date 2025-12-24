# LuxeCut Barber Shop - Architectural Blueprint & Rule Set

## 🖼️ 1. Architectural Blueprint (The "What")

### Project Overview
LuxeCut is a comprehensive barber shop management system built with React 19, TypeScript, and Supabase. It features appointment booking, product sales, loyalty programs, and analytics dashboards with enterprise-grade safety infrastructure.

### Tech Stack
- **Frontend**: React 19, React Router 7, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL 17, Edge Functions, Auth, Storage)
- **Infrastructure**: Vite 6, Docker, Nginx
- **AI Integration**: Google GenAI
- **Testing**: Vitest, React Testing Library

### Core Architecture
```
Frontend (React SPA) ↔ API Gateway (Supabase Edge Functions) ↔ Database (PostgreSQL)
                              ↕
                       Authentication (Supabase Auth)
                              ↕
                         Storage (Supabase Storage)
```

### Key Design Patterns
1. **Microservices-style Edge Functions** - ~70 independent functions for specific operations
2. **Hybrid Data Access** - Public data reads directly from DB, writes/protected reads via Edge Functions
3. **Security-first Approach** - CSRF protection, rate limiting, input validation on all endpoints
4. **Performance Optimization** - Vite manual chunking, Redis-based caching, in-memory fallbacks

### Directory Structure
```
luxecut-barber-shop/
├── components/          # Reusable UI components
├── pages/               # Route-based pages
├── services/            # Business logic and API calls
├── supabase/functions/  # 70+ Edge Functions
├── contexts/            # React context providers
├── docs/                # Documentation
└── tests/               # Test files
```

### Authentication & Security Model
1. **Role-Based Access Control**:
   - `customer` - Basic access, booking, purchasing
   - `barber` - Schedule management, attendance
   - `admin` - Full system access

2. **CSRF Protection**:
   - Double-submit cookie pattern
   - Token generation via `generate-csrf-token` function
   - Validation in `authenticateUser` helper

3. **API Security**:
   - All authenticated endpoints require CSRF token
   - Rate limiting per IP/user/endpoint
   - Input validation with shadow mode testing

### Data Flow Example (Booking Process)
1. Customer selects services → `get-services` (public)
2. Customer selects date/time → `get-available-slots` (authenticated)
3. Customer confirms booking → `create-booking` (authenticated)
4. System updates availability → Database triggers
5. Notifications sent → Realtime subscriptions

## 🛡️ 2. Rule Set for Integrity (The "How")

### Security/Authentication Rules
1. **NEVER DISABLE AUTHENTICATION**: All fixes MUST retain or strengthen authentication checks. Making functions public to bypass errors is strictly prohibited.
2. **CSRF TOKEN REQUIREMENT**: Every authenticated API call MUST include the X-CSRF-Token header. Functions that require authentication MUST validate CSRF tokens.
3. **ROLE VALIDATION**: Role-specific functions MUST verify user roles before processing. Unauthorized access attempts MUST be logged.
4. **SESSION MANAGEMENT**: Authentication tokens MUST be properly validated and refreshed. Expired sessions MUST redirect to login.

### Configuration Rules
1. **ENVIRONMENT VARIABLES**: All environment-specific values (API keys, URLs, feature flags) MUST be loaded from environment variables, never hardcoded.
2. **SECRET MANAGEMENT**: Sensitive data MUST be stored in Supabase secrets, not in code or .env files.
3. **FEATURE FLAGS**: New features MUST be controlled by feature flags for safe rollouts and easy rollback.
4. **DATABASE CONNECTIONS**: Database connections MUST use service role keys for Edge Functions, anon keys for client-side.

### Testing Rules
1. **UNIT TEST COVERAGE**: All business logic functions MUST have unit tests covering normal and edge cases.
2. **INTEGRATION TESTING**: API endpoints MUST be tested with real database interactions.
3. **SECURITY TESTING**: Authentication bypass attempts MUST be tested regularly.
4. **REGRESSION PREVENTION**: Bug fixes MUST include tests to prevent recurrence.

### Immutability/Side Effects Rules
1. **PURE FUNCTIONS**: Business logic functions SHOULD be pure with minimal side effects.
2. **STATE ISOLATION**: Component state MUST be properly isolated and managed.
3. **ASYNC HANDLING**: Asynchronous operations MUST handle errors appropriately.
4. **DATA CONSISTENCY**: Database operations MUST maintain data integrity through transactions where needed.

### Database Schema Rules
1. **MIGRATION SAFETY**: Schema changes MUST be backward compatible when possible.
2. **COLUMN REFERENCES**: Code MUST be updated when database columns are added/removed.
3. **INDEXING**: Frequently queried columns MUST be indexed for performance.
4. **RELATIONSHIPS**: Foreign key relationships MUST be properly maintained.

### Error Handling Rules
1. **USER-FRIENDLY MESSAGES**: Error messages shown to users MUST be informative but not expose system details.
2. **LOGGING**: All errors MUST be logged with sufficient context for debugging.
3. **RECOVERY**: Systems MUST gracefully handle errors and provide recovery paths.
4. **SECURITY LOGS**: Security-related errors MUST be logged to dedicated security logs table.

### Code Quality Rules
1. **TYPE SAFETY**: TypeScript types MUST be used consistently throughout the codebase.
2. **NAMING CONVENTIONS**: Variables and functions MUST use descriptive camelCase names.
3. **CONSISTENT PATTERNS**: Similar functionality MUST follow established patterns.
4. **DOCUMENTATION**: Complex logic MUST be documented with inline comments.

### Performance Rules
1. **LAZY LOADING**: Non-critical components MUST be lazy-loaded.
2. **CACHING**: Frequently accessed data SHOULD be cached appropriately.
3. **BUNDLE SIZE**: Code splitting MUST be used to minimize bundle sizes.
4. **DATABASE QUERIES**: Queries MUST be optimized and avoid N+1 problems.

### Deployment Rules
1. **STAGING FIRST**: All changes MUST be tested in staging before production.
2. **ROLLBACK READY**: Every deployment MUST have a clear rollback procedure.
3. **MONITORING**: Deployed features MUST be monitored for errors and performance.
4. **INCREMENTAL ROLLOUT**: Major features SHOULD be rolled out gradually to users.

This document serves as the authoritative guide for maintaining the integrity and security of the LuxeCut Barber Shop application. Any modifications to the codebase MUST adhere to these rules to prevent degradation of security, performance, or maintainability.