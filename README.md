# LuxeCut Barber Shop

A comprehensive barber shop management system built with React 19, TypeScript, and Supabase.

## Overview

LuxeCut is a modern barber shop management application featuring appointment booking, product sales, loyalty programs, and analytics dashboards. This implementation includes a comprehensive safety infrastructure to ensure secure, reliable, and scalable operations.

## Safety Infrastructure Status: ✅ FULLY DEPLOYED AND ACTIVE

The safety infrastructure has been successfully implemented, deployed, and fully activated with all protective measures in enforcement mode.

## Key Safety Components

- `safety-core.ts` - Core safety wrapper functions with feature flags
- `validation-suite.ts` - Input validation with Zod-like schemas and shadow mode
- `rate-limiter.ts` - Rate limiting with configurable thresholds
- `security-headers.ts` - Comprehensive security headers for all responses
- `cache-service.ts` - Caching layer with TTL support
- `metrics.ts` - Metrics collection system
- `alerts.ts` - Alerting mechanism
- `rollout-manager.ts` - Gradual feature rollout manager

## Deployed Functions

- `health` - System health monitoring endpoint
- `test-safety` - Verification function for safety infrastructure
- `export-data` - Export functionality with enhanced safety features and CSRF protection
- `generate-csrf-token` - CSRF token generation for protected endpoints

## Documentation

- [Safety Infrastructure Guide](docs/SAFETY_INFRASTRUCTURE.md)
- [Monitoring Guide](docs/MONITORING_GUIDE.md)
- [API Contracts](docs/API_CONTRACTS.md)
- [API Migration Guide](docs/API_MIGRATION_GUIDE.md)
- [Architectural Blueprint and Rules](docs/ARCHITECTURAL_BLUEPRINT_AND_RULES.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Excel Roster Integration Guide](docs/EXCEL_ROSTER_INTEGRATION_GUIDE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Roster Expiration Enhancement](docs/ROSTER_EXPIRATION_ENHANCEMENT.md)
- [Testing Guide](docs/TESTING_GUIDE.md)

## Scripts

- `scripts/backup-db.sh` - Database backup utility
- `scripts/emergency-rollback.sh` - Emergency rollback procedures
- `scripts/test-functions.sh` - Function testing utility
- `scripts/full-deployment.sh` - Full deployment script
- `scripts/check-security-logs.sh` - Security monitoring script
- `scripts/simple-health-check.sh` - Simple health check script

## DevOps

- Enhanced CI/CD pipeline with staging/production environments
- Feature flag management
- Automated monitoring and alerting

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. ~~Apply database migrations (see manual migration guide)~~ ✅ COMPLETED
4. ~~Configure Supabase secrets/feature flags~~ ✅ COMPLETED
5. ~~Deploy functions: `supabase functions deploy`~~ ✅ COMPLETED
6. ~~Test functions with authentication~~ ✅ COMPLETED
7. ~~Begin phased rollout of enhanced features~~ ✅ COMPLETED (Full deployment applied)

## Testing

Run tests with: `npm test`

## Building

Build for production: `npm run build`

## License

This project is proprietary and confidential.