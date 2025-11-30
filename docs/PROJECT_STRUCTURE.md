# LuxeCut Barber Shop - Project Structure

## 🚀 Production Files

### Core Application
- `App.tsx` - Main React application component
- `index.tsx` - Application entry point
- `index.html` - HTML template
- `constants.ts` - Application constants and mock data
- `types.ts` - TypeScript type definitions

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.cjs` - PostCSS configuration

### Source Code
- `pages/` - React page components
- `components/` - Reusable React components
- `contexts/` - React context providers
- `services/` - API and external service integrations
- `src/` - CSS and static assets
- `public/` - Public assets

### Backend
- `supabase/` - Supabase configuration and Edge Functions
  - `functions/` - 50+ Edge Function endpoints
  - `migrations/` - Database migration files

## 📁 Archived Development Files

### Documentation History
- `docs/development-history/` - All development documentation and progress notes

### Development Artifacts
- `archive/sql-development/` - SQL test queries and schema checks
- `archive/test-scripts/` - JavaScript test files and debug scripts
- `archive/page-backups/` - Component backup files

## 🧹 Cleanup Summary

**Moved to Archive:**
- 25+ SQL development files
- 20+ JavaScript test files
- 15+ Markdown documentation files
- Page backup files (.backup, .corrupted, etc.)

**Preserved Core Files:**
- All production source code
- Configuration files
- Package definitions
- Database migrations
- Edge Functions

This cleanup maintains a clean production-ready codebase while preserving development history for reference.