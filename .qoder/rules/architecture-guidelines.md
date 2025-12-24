---
trigger: model_decision
description: "Provide architectural guidance for LuxeCut Barber Shop"
---

# Architecture Guidelines

## Project Overview
LuxeCut is a comprehensive barber shop management system built with React 19, TypeScript, and Supabase. It features appointment booking, product sales, loyalty programs, and analytics dashboards with enterprise-grade safety infrastructure.

## Tech Stack
- Frontend: React 19, React Router 7, TypeScript, Tailwind CSS 4
- Backend: Supabase (PostgreSQL 17, Edge Functions, Auth, Storage)
- Infrastructure: Vite 6, Docker, Nginx
- AI Integration: Google GenAI
- Testing: Vitest, React Testing Library

## Core Architecture
Frontend (React SPA) ↔ API Gateway (Supabase Edge Functions) ↔ Database (PostgreSQL)
                              ↕
                       Authentication (Supabase Auth)
                              ↕
                         Storage (Supabase Storage)

## Key Design Patterns
1. Microservices-style Edge Functions - ~70 independent functions for specific operations
2. Hybrid Data Access - Public data reads directly from DB, writes/protected reads via Edge Functions
3. Security-first Approach - CSRF protection, rate limiting, input validation on all endpoints
4. Performance Optimization - Vite manual chunking, Redis-based caching, in-memory fallbacks

## Directory Structure
luxecut-barber-shop/
├── components/          # Reusable UI components
├── pages/               # Route-based pages
├── services/            # Business logic and API calls
├── supabase/functions/  # 70+ Edge Functions
├── contexts/            # React context providers
├── docs/                # Documentation
└── tests/               # Test files

When working with this codebase, always follow these architectural principles:
- Maintain separation of concerns between frontend, backend, and database layers
- Use Edge Functions for all business logic that requires authentication or data mutation
- Follow the existing patterns for data fetching and state management
- Respect the component hierarchy and role-based access controls