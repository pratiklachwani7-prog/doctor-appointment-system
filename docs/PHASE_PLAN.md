# Phase Plan Checklist

**Project:** MediConnect - Smart Healthcare Appointment Platform  
**Branch:** phase-2-foundation → phase-3-auth-roles → phase-4-booking-engine  
**Status:** In Progress

---

## Phase 2: Foundation

### Core Documentation (from actual codebase)
- [x] PRD.md (committed: b954600)
- [x] ARCHITECTURE.md (committed: 9c9e183)
- [ ] DATABASE.md — from actual Mongoose models + planned indexes
- [ ] CODE_STYLE.md — from existing conventions + TS/ESLint rules
- [ ] SECURITY.md — from audit findings + planned fixes
- [ ] TESTING.md — strategy for unit/integration/e2e
- [ ] flow.md — auth, booking, payment flows from actual code
- [ ] AGENTS.md — shared AI agent instructions
- [ ] CLAUDE.md — with `@AGENTS.md` import
- [ ] CONSTRAINTS.md — protected areas, boundaries

### TypeScript & Tooling Setup
- [ ] tsconfig.json (allowJs, strict, ES2022, NodeNext)
- [ ] package.json: add TypeScript, tsx, @types/node, @types/express, zod, pino, vitest, eslint, prettier
- [ ] .eslintrc.js (TypeScript, recommended, prettier)
- [ ] .prettierrc (single quote, trailing comma, 100 width)
- [ ] .env.example (all required vars, no secrets)
- [ ] Update package.json scripts: dev, build, start, test, lint, format

### Layered Architecture Restructure
- [ ] Create `src/` folder structure (config, modules, shared, app.ts, server.ts)
- [ ] Migrate models to TypeScript with proper types, indexes, timestamps, validation
- [ ] Create Repository layer (base + user, doctor, appointment, admin)
- [ ] Create Service layer (auth, users, doctors, appointments, admin)
- [ ] Create Controller layer (thin, HTTP only)
- [ ] Create Routes with /api/v1 prefix
- [ ] Centralized error handling middleware
- [ ] Standard API response format utility

### Zod Validation
- [ ] Zod schemas for all endpoints (auth, users, doctors, appointments, admin)
- [ ] Validation middleware (body, query, params)
- [ ] Standard validation error response format

### Config, Logging, Health Check
- [ ] Centralized config module (validated env)
- [ ] Pino structured logger
- [ ] Health check endpoint (/api/v1/health)

### API Features
- [ ] API versioning (/api/v1)
- [ ] Pagination, filtering, sorting on list endpoints

### Database
- [ ] Mongoose schemas with proper indexes (compound, partial, unique)
- [ ] Migration/seed script with synthetic data

### Docker & CI Prep
- [ ] docker-compose.yml (API + MongoDB replica set + init script)
- [ ] MongoDB replica set initialization script

### Tests
- [ ] Unit tests for services (booking logic, validation)
- [ ] Integration tests for API endpoints
- [ ] Test utilities and fixtures

---

## Phase 3: Auth & Roles

### Authentication
- [ ] Register/Login with bcrypt (12 rounds)
- [ ] Access tokens (15min) + Refresh tokens (7d, rotation)
- [ ] JWT in HttpOnly, Secure, SameSite=Lax cookies
- [ ] Password reset flow (email token, expiry)

### Authorization (RBAC)
- [ ] Three roles: PATIENT, DOCTOR, ADMIN
- [ ] RBAC middleware on all protected routes
- [ ] Doctor verification by admin (isVerified field)
- [ ] Unverified doctors hidden from public search

### Security Hardening
- [ ] Rate limiting on auth routes (10/min)
- [ ] Helmet headers
- [ ] CORS configured with specific origins
- [ ] No secrets in logs/responses

---

## Phase 4: Core Booking Engine

### Availability & Slots
- [ ] Doctor weekly schedule (dayOfWeek, startTime, endTime, slotDuration)
- [ ] Breaks (lunch, custom)
- [ ] Leave days (date ranges)
- [ ] Slot generation API (doctorId, dateRange)

### Booking Logic
- [ ] Book appointment (transaction: check slot + create + update doctor)
- [ ] Cancel appointment (frees slot, notifies waitlist)
- [ ] Reschedule appointment
- [ ] Business rules: cutoff window, no past, no patient overlap

### Status Lifecycle
- [ ] PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW
- [ ] Invalid transitions rejected

### Waitlist
- [ ] Waitlist model (doctorId, slotStart, userId, position, notifiedAt)
- [ ] Auto-notify first waitlisted on cancellation

### Double-Booking Prevention
- [ ] Unique compound index: (doctorId, slotStart) with partialFilterExpression {cancelled: false}
- [ ] Mongoose transactions for multi-document consistency
- [ ] Concurrency test: 100 simultaneous requests → exactly 1 success

---

## Verification Gates

### Phase 2 Gate
- [ ] Build: `tsc --noEmit` passes
- [ ] Lint: ESLint passes
- [ ] Format: Prettier passes
- [ ] Tests: all pass (unit + integration)
- [ ] App starts: `docker compose up` → `/api/v1/health` responds
- [ ] Seed script runs
- [ ] Zod validation rejects invalid input
- [ ] Pagination works
- [ ] Errors use standard format
- [ ] No secrets in diff
- [ ] `npm audit` reviewed
- [ ] Docs sync: all affected docs updated

### Phase 3 Gate
- [ ] Wrong-role access returns 403
- [ ] Unauthenticated returns 401
- [ ] Tokens expire and refresh correctly
- [ ] Unverified doctors hidden from search
- [ ] Auth rate limiting works
- [ ] Password reset flow works

### Phase 4 Gate
- [ ] Slot generation correct around breaks/leave
- [ ] Concurrency test passes
- [ ] Cancel frees slot
- [ ] Invalid status transitions rejected
- [ ] Waitlist notifies correctly

---

## Current Status

**Phase:** 2 (Foundation)  
**Branch:** phase-2-foundation  
**Next:** Create DATABASE.md, CODE_STYLE.md, SECURITY.md, TESTING.md, flow.md, AGENTS.md, CLAUDE.md, CONSTRAINTS.md
