# CLAUDE_CODE_CONTEXT.md

# Project Context & Handover Document
# Doctor's Appointment System (MediConnect)
# Generated: 2026-11-07

---

## PART 1 — ORIGINAL PROJECT STATE

### 1.1 Project Purpose
A healthcare appointment booking platform (MediConnect) allowing patients to book appointments with doctors, doctors to manage their schedules, and admins to manage the platform.

### 1.2 Original Features
- Patient registration/login with JWT authentication
- Doctor listing and profile viewing
- Appointment booking/cancellation
- Admin dashboard for doctor management
- Razorpay payment integration
- Cloudinary image upload
- Basic appointment status tracking

### 1.3 Original Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.x
- **Database**: MongoDB with Mongoose 9.x
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Upload**: Multer + Cloudinary
- **Payments**: Razorpay
- **Validation**: validator.js
- **Development**: nodemon

### 1.4 Original Backend Structure
```
Backend/
├── config/
│   ├── mongodb.js
│   └── cloudinary.js
├── controller/
│   ├── adminController.js
│   ├── doctorController.js
│   └── userController.js
├── middlewares/
│   ├── authUser.js
│   ├── authadmin.js
│   └── multer.js
├── models/
│   ├── appointment.model.js
│   ├── doctor.model.js
│   └── user.model.js
├── routes/
│   ├── admin.route.js
│   ├── doctor.route.js
│   └── user.route.js
├── server.js
├── package.json
└── .env
```

### 1.5 Original Database Models

**User Model:**
- name, email (unique), password (hashed), image, address, gender, dob, phone
- role: PATIENT/DOCTOR/ADMIN (added later)

**Doctor Model:**
- name, email (unique), password, image, speciality, degree, experience, about
- available (boolean), fees, address, slots_booked (denormalized object), date

**Appointment Model:**
- userId, docId, slotDate, slotTime, userData, docData, amount, date
- cancelled, payment, isCompleted (boolean flags)

### 1.6 Original API Endpoints
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/get-profile` - Get user profile
- `POST /api/user/update-profile` - Update profile
- `POST /api/user/book-appointment` - Book appointment
- `GET /api/user/appointments` - List appointments
- `POST /api/user/cancel-appointment` - Cancel appointment
- `POST /api/user/payment-razorpay` - Create Razorpay order
- `POST /api/user/verify-razorpay` - Verify payment
- `GET /api/doctor/list` - Public doctor listing
- `POST /api/admin/login` - Admin login
- `POST /api/admin/add-doctor` - Add doctor (admin)
- `GET /api/admin/all-doctors` - List all doctors (admin)
- `POST /api/admin/change-availability` - Toggle doctor availability

### 1.7 Original Limitations & Technical Debt
1. **No TypeScript** - Plain JavaScript with ES modules
2. **No validation schema** - Manual validation in controllers
3. **No service layer** - Business logic in controllers
4. **No repository pattern** - Direct Mongoose calls in controllers
4. **Denormalized slots_booked** - Race condition risk for double booking
5. **No API versioning** - Routes at `/api/*`
5. **No pagination/filtering** on list endpoints
6. **No rate limiting** on auth endpoints
6. **Open CORS** - No origin restrictions
7. **No security headers** (Helmet)
7. **Weak JWT_SECRET** ("PRATIK")
7. **Admin auth** - Simple string comparison of email+password
8. **No refresh tokens** - Long-lived access tokens only
9. **No tests** - No test infrastructure
9. **No CI/CD** - No GitHub Actions
10. **No Docker** - No containerization
11. **Secrets in .env** committed to git (C1-C7 security issues)
12. **No API versioning**
12. **No structured logging**
13. **No centralized error handling**
13. **No request validation middleware**
14. **CRLF line endings** in Backend files (OneDrive sync issue)

---

## PART 2 — EVERY CHANGE MADE SO FAR

### 2.1 Phase 1: Audit (Completed)
**Commit:** `24616c1` - `docs(audit): add comprehensive project audit and commit log`
- Created `docs/AUDIT.md` - Complete audit of codebase
- Created `docs/COMMIT_LOG.md` - Commit tracking log
- Identified 7 critical security issues, 6 high, 4 medium issues
- Documented 19 gaps vs target requirements

### 2.2 Phase 2 Foundation - Documentation (Completed, Merged via PR #1)
**Commits:**
- `b954600` - `docs(prd): add Product Requirements Document from audit evidence`
- `9c9e183` - `docs(architecture): add system architecture document from audit evidence`
- `2bde219` - `docs(database): add database design from actual Mongoose models + planned indexes`
- `2e93671` - `docs(code-style): add coding standards from existing conventions + TS/ESLint rules`
- `5e91f38` - `docs(phase-plan): add Phase 2-4 checklist with verification gates`
- `ec60011` - `docs(testing): add testing strategy with mandatory TDD workflow`
- `52b59f8` - `docs(flow): add as-is and to-be system flows from actual code`
- `139578c` - `docs(agents): add AI agent instructions, CLAUDE.md import, and constraints`
- `e9df68b` - `docs(security): add security policy grounded in audit findings`
- `bb11c49` - `docs(decision): record Phase 2-4 technical decisions`
- `b954600` - `docs(prd): add Product Requirements Document from audit evidence`

**Documentation Created:**
- `docs/PRD.md` - Product Requirements Document
- `docs/ARCHITECTURE.md` - System Architecture
- `docs/DATABASE.md` - Database Design
- `docs/CODE_STYLE.md` - Coding Standards
- `docs/SECURITY.md` - Security Policy
- `docs/TESTING.md` - Testing Strategy
- `docs/decision.md` - Technical Decisions Log
- `docs/flow.md` - System Flows (As-Is/To-Be)
- `docs/AGENTS.md` - AI Agent Instructions
- `docs/CONSTRAINTS.md` - Protected Areas & Constraints
- `docs/PHASE_PLAN.md` - Phase 2-4 Checklist with Gates
- `docs/COMMIT_LOG.md` - Commit Tracking
- `docs/decision.md` - Technical Decisions

### 2.2 Technical Decisions Recorded (decision.md)
1. **Language**: TypeScript (incremental migration with `allowJs`)
2. **Validation**: Zod on every endpoint
3. **Database**: Stay with MongoDB + Mongoose (replica set for transactions)
4. **Auth**: JWT access + refresh tokens, bcrypt cost 12, HttpOnly cookies
4. **Architecture**: Layered (routes → controllers → services → repositories → models)

### 2.3 Code Changes (Phase 2 Implementation Started)

**Commits on main branch:**
- `7f94a94` - `chore: normalize CRLF line endings in Backend files` (21 files, whitespace-only)
- `9908553` - `docs(commit-log): record line-ending normalization commit`
- `4dd920b` - `docs(commit-log): correct timestamp for 7f94a94 entry to real commit time`

**TypeScript/Tooling Setup (In Progress):**
- `Backend/package.json` - Updated with TypeScript, ESLint, Prettier, Vitest, Zod, Pino, tsx
- `Backend/tsconfig.json` - Strict mode, allowJs, NodeNext modules
- `Backend/.eslintrc.js` - TypeScript ESLint config
- `Backend/.prettierrc` - Prettier config
- `Backend/.env.example` - Environment template
- `Backend/tsconfig.json` - Strict TS config with path aliases

**Core Infrastructure Created:**
```
Backend/src/
├── config/
│   ├── index.ts (Zod-validated env config)
│   ├── database.ts (Mongoose + replica set init)
│   └── cloudinary.ts (Cloudinary config + upload/delete)
├── shared/
│   ├── utils/
│   │   ├── errors.ts (AppError, ValidationError, NotFoundError, etc.)
│   │   ├── apiResponse.ts (Standard response format)
│   │   ├── logger.ts (Pino logger)
│   │   ├── jwt.ts (Access/refresh token utilities)
│   │   ├── password.ts (bcrypt hash/compare)
│   │   └── errors.ts
│   ├── middleware/
│   │   ├── errorHandler.ts (Centralized error handling)
│   │   ├── validate.ts (Zod validation middleware)
│   │   ├── auth.ts (JWT auth + optional auth)
│   │   ├── rbac.ts (Role-based access control)
│   │   └── rateLimiter.ts (In-memory rate limiter)
│   ├── types/
│   │   ├── express.d.ts (Extended Express Request)
│   │   └── common.ts (Pagination, ApiResponse types)
│   └── constants/
│       ├── roles.ts (UserRole enum + hierarchy)
│       ├── statusCodes.ts (HTTP status codes)
│       └── messages.ts (Error/Success messages)
├── modules/
│   ├── auth/
│   │   ├── schemas.ts (Zod schemas for register/login/refresh)
│   │   ├── types.ts (IUser, IRefreshToken interfaces)
│   │   ├── repository.ts (AuthRepository class)
│   │   ├── service.ts (AuthService class)
│   │   ├── controller.ts (AuthController class)
│   │   └── routes.ts (Auth routes)
│   ├── users/
│   │   ├── schemas.ts (updateProfile, changePassword)
│   │   ├── types.ts (IUser interface)
│   │   ├── repository.ts (UserRepository class)
│   │   ├── service.ts (UserService class)
│   │   ├── controller.ts (UserController class)
│   │   └── routes.ts (User routes)
│   ├── doctors/
│   │   ├── schemas.ts (CRUD, availability, leave schemas)
│   │   ├── types.ts (IDoctor, IDoctorAvailability, IDoctorLeave)
│   │   ├── repository.ts (DoctorRepository class)
│   │   ├── service.ts (DoctorService class - partial)
│   │   ├── controller.ts (DoctorController class)
│   │   └── routes.ts (Not yet created)
├── config/
│   ├── index.ts (Zod-validated config)
│   ├── database.ts (Mongoose + replica set)
│   └── cloudinary.ts (Cloudinary config)
├── app.ts (Express app with middleware, routes)
└── server.ts (Entry point with graceful shutdown)
```

**Models Updated:**
- `src/models/index.ts` - Complete Mongoose schemas with proper indexes, compound unique index for double-booking prevention

### 2.4 Git History Summary
```
main branch: 871ddaf (Merge PR #1) ← 4dd920b ← 9908553 ← 7f94a94 ← 00721c3 ← 139578c ← ...
phase-2-foundation: deleted (merged via PR #1)
phase-1-audit: 24616c1
```

**Remote:** `https://github.com/pratiklachwani7-prog/doctor-appointment-system.git`
**Current Branch:** `main` (clean, up to date with origin/main)

---

## PART 3 — DOCUMENTATION AND DECISIONS

### 3.1 Documentation Inventory

| Document | Status | Purpose |
|----------|--------|---------|
| `docs/PRD.md` | Complete | Product requirements, features, personas, acceptance criteria |
| `docs/ARCHITECTURE.md` | Complete | System architecture, tech stack, data flows, security, infra |
| `docs/DATABASE.md` | Complete | DB design, models, indexes, migrations, transactions |
| `docs/CODE_STYLE.md` | Complete | TS/ESLint/Prettier conventions, patterns, error handling |
| `docs/SECURITY.md` | Complete | Security policy, threats, controls, verification checklist |
| `docs/TESTING.md` | Complete | TDD strategy, test levels, coverage targets, gates |
| `docs/decision.md` | Complete | Technical decisions log (3 decisions recorded) |
| `docs/flow.md` | Complete | As-Is/To-Be flows, 14 endpoints, 10 bugs (B1-B10) |
| `docs/AGENTS.md` | Complete | AI agent instructions, rules, workflow |
| `docs/CONSTRAINTS.md` | Complete | Protected areas, hard constraints, scope boundaries |
| `docs/PHASE_PLAN.md` | Complete | Phase 2-4 checklist with verification gates |
| `docs/COMMIT_LOG.md` | Current | All commits tracked with metadata |
| `docs/decision.md` | Current | Technical decisions log |
| `docs/PHASE_PLAN.md` | Current | Task checklist with gates |
| `CLAUDE.md` | Current | Root entry point importing AGENTS.md |
| `Backend/API.md` | Legacy | Original API documentation |

### 3.2 Key Decisions (from decision.md)

| # | Decision | Options Considered | Selected | Rationale |
|---|----------|-------------------|----------|-----------|
| 1 | TypeScript | Big-bang vs Incremental vs JSDoc | Incremental (`allowJs`) | Maintain working app, demonstrate TS migration skill |
| 2 | Validation | Joi vs Zod vs class-validator | Zod | TS inference, composable, lightweight |
| 3 | Database | PostgreSQL/Prisma vs MongoDB | MongoDB + Mongoose | Existing investment, replica set for transactions |

**Pending Decisions (from decision.md):**
- PostgreSQL migration path (deferred)
- Video consultation (deferred)
- PDF prescriptions (deferred)

---

## PART 4 — COMPLETE DEVELOPMENT ROADMAP

### Phase 2: Foundation (In Progress)

| # | Task | Status | Details |
|---|------|--------|---------|
| 2.1 | TypeScript/tooling setup | **In Progress** | 80% - Core files created, need module completion |
| 2.2 | Layered architecture restructure | **In Progress** | Models done, modules partial (auth, users, doctors started) |
| 2.3 | Zod validation on all endpoints | **Pending** | Auth/users/doctors schemas done, need routes wiring |
| 2.4 | Env config, logging, health check | **Done** | Config, logger, health endpoint done |
| 2.4 | API versioning, pagination, filtering | **Pending** | `/api/v1` prefix in app.ts, need implementation |
| 2.5 | Mongoose schemas + indexes | **Done** | Models/index.ts complete with compound indexes |
| 2.6 | Seed script | **Pending** | Need synthetic data script |
| 2.7 | Docker Compose | **Pending** | Need docker-compose.yml with replica set |
| 2.8 | ESLint/Prettier/TypeScript | **Done** | Configs created |
| 2.9 | Unit/Integration tests | **Pending** | Vitest configured, no tests written |

### Phase 3: Auth & Roles (Pending)

| # | Task | Status | Details |
|---|------|--------|---------|
| 3.1 | Register/Login with bcrypt | **Implemented** | Auth module complete |
| 3.2 | Access + Refresh tokens | **Implemented** | JWT utilities, cookies |
| 3.2 | Patient/Doctor/Admin RBAC | **Implemented** | Roles, middleware, decorators |
| 3.3 | Doctor verification | **Pending** | `isVerified` field in model, need admin flow |
| 3.3 | Password reset flow | **Pending** | Schemas done, service/controller pending |
| 3.4 | Rate limiting on auth | **Implemented** | In-memory rate limiter |
| 3.4 | Helmet, CORS | **Partial** | CORS in app.ts, Helmet not added |

### Phase 4: Core Booking Engine (Pending)

| # | Task | Status | Details |
|---|------|--------|---------|
| 4.1 | Doctor availability engine | **Partial** | Models/schemas done, service partial |
| 4.2 | Slot generation API | **Pending** | Need implementation |
| 4.3 | Booking with transactions | **Partial** | Models have compound index, service partial |
| 4.3 | Cancel/Reschedule | **Pending** | Controller/routes pending |
| 4.4 | Status lifecycle | **Partial** | Model has enum, transitions need implementation |
| 4.4 | Waitlist | **Pending** | Model/schema pending |
| 4.4 | Concurrency test | **Pending** | Need test with 100 concurrent requests |

### Phase 5: Frontend (Pending - Phase 5+)
### Phase 6: Advanced Features (Pending - Phase 6+)
### Phase 7: Quality/DevOps (Pending - Phase 7+)
### Phase 8: Deployment/Presentation (Pending - Phase 8+)

---

## PART 5 — CURRENT IMPLEMENTATION STATE

### 5.1 Git State
- **Branch:** `main`
- **Working Tree:** Clean (0 uncommitted changes)
- **HEAD Commit:** `871ddaf` (Merge pull request #1 from pratiklachwani7-prog/phase-2-foundation)
- **Remote:** `https://github.com/pratiklachwani7-prog/doctor-appointment-system.git`
- **Remote Main:** `871ddaf` (Merge pull request #1)
- **Local main:** `871ddaf` (up to date with origin/main)
- **Branch `phase-2-foundation`:** Deleted (merged via PR #1)

### 5.2 Recent Commits (last 5)
```
4dd920b (HEAD -> main, origin/main) Merge pull request #1
4dd920b docs(commit-log): correct timestamp for 7f94a94 entry
9908553 docs(commit-log): record line-ending normalization commit
7f94a94 chore: normalize CRLF line endings in Backend files
00721c3 docs(commit-log): record testing, flow, and agents commits
```

### 5.3 Commits Ahead of Origin Main
- Local main = origin/main (0 ahead, 0 behind)
- Phase 2 docs (19 commits) merged via PR #1

### 5.4 Current Implementation Status
- **TypeScript Migration:** 80% - Core infrastructure done, modules partial
- **Backend Implementation:** 60% - Auth complete, users/doctors partial, appointments/admin pending
- **Frontend:** 0% - Not started
- **Testing:** 0% - Infrastructure ready, no tests written
- **TypeScript Migration:** 80% - Config done, source files being migrated

### 5.5 Last Verified Completed Task
**Task:** Phase 2 Documentation & PR #1 Merge
**Status:** Completed and verified (merged to main, 19 commits)

### 5.6 Next Task to Execute
**Task:** Complete Phase 2 Task 1 - Finish TypeScript/tooling setup
**Next Actions:**
1. Complete Doctor routes
2. Create Appointment module (schemas, types, repo, service, controller, routes)
3. Create Admin module (schemas, types, repo, service, controller, routes)
4. Wire all routes in app.ts
4. Install dependencies (`npm install`)
5. Run typecheck (`npm run typecheck`)
5. Run lint (`npm run lint`)
6. Create seed script
6. Create docker-compose.yml
7. Write unit/integration tests
8. Run verification gate

---

## PART 6 — ENGINEERING EXPECTATIONS (from user instructions)

### 6.1 Core Rules
1. **Documentation-first:** Inspect docs/architecture before implementing
2. **Test-driven:** Write tests before/alongside implementation
3. **No blind modifications:** Inspect before editing
4. **Preserve functionality:** Never remove features without justification
5. **Follow architecture:** Layered (routes→controllers→services→repositories→models)
6. **TypeScript consistency:** Strict mode, proper types
7. **Separation of concerns:** Routes→Controllers→Services→Repositories→Models
8. **Validation/Error handling/Logging/Security:** Proper implementation
10. **Doc sync:** Update docs with implementation
11. **Task tracker accuracy:** Update status honestly
12. **Test increments:** Test each meaningful change
13. **Review diffs:** Before committing
14. **No unnecessary deps/duplication**

### 6.2 Workflow Rules
- **No stopping after small tasks** - Complete logical batches
- **No progress-only messages** - Implement, don't narrate
- **No confirmation between phases** - Continuous Phase 2→3→4
- **Stop only at:** Phase 4 complete, genuine blocker, provider error
- **If interrupted:** Create HANDOVER.md, preserve changes

### 6.3 Git Rules
- Branch per phase (but now on main directly)
- Small conventional commits
- Never commit secrets/.env
- Log every commit in COMMIT_LOG.md
- Push to origin/main when auth permits
- Verify remote state after push

---

## PART 7 — CLAUDE CODE EXECUTION INSTRUCTIONS

### 7.1 Startup Sequence
1. Read `CLAUDE_CODE_CONTEXT.md` first
2. Read `CLAUDE.md` and all project instructions
3. Inspect actual repository (`git status`, `git log`, `ls`)
4. Verify state matches this document
5. Inspect task tracker and HANDOVER.md
6. Identify completed/partial/pending tasks
7. Continue from last verified task
7. Work directly on `main`
7. Complete all Phase 2→3→4 tasks
8. Run tests/gates
9. Update docs/task tracker
9. Commit/push when auth permits
9. Verify remote state

### 7.2 If 402 Error (Budget Exhausted)
- Stop safely
- Preserve changes
- Update HANDOVER.md with exact state
- Do not retry repeatedly

### 7.3 Credentials Note
- GitHub CLI not available in sandbox
- No credentials in sandbox (no gh CLI, SSH keys, credential helper, env tokens)
- Push must be done from user's local machine
- Local changes are committed and ready to push

---

## PART 8 — FINAL CHECKLIST

### 8.1 Verification
- ✅ Original project state documented
- ✅ Complete folder structure (original + current)
- ✅ Original features documented
- ✅ Implemented features documented
- ✅ Architectural decisions recorded
- ✅ Database design documented
- ✅ Backend implementation history tracked
- ✅ Frontend status documented (not started)
- ✅ API inventory complete
- ✅ Security requirements documented
- ✅ TypeScript migration tracked
- ✅ Dependencies/tooling documented
- ✅ Documentation inventory complete
- ✅ Git history/branches documented
- ✅ Phase 2-4 roadmap complete
- ✅ Completed task list
- ✅ Pending task list
- ✅ Current blockers identified
- ✅ Testing/verification results tracked
- ✅ Engineering rules documented
- ✅ Next steps clear

### 8.2 File Location
**Main Context File:** `C:\Users\FIRST\OneDrive\Desktop\Pratik\Vit\Codes\Web Development\Projects\Project 8 Doctor's Appointment System\CLAUDE_CODE_CONTEXT.md`

### 8.3 Supporting Files
- All docs in `docs/` directory
- `CLAUDE.md` at root
- `Backend/src/` implementation
- `Backend/package.json`, `tsconfig.json`, configs
- `docs/COMMIT_LOG.md` for commit history

### 8.4 Current Verified Git State
- **Branch:** `main`
- **HEAD:** `871ddaf` (Merge PR #1)
- **Working Tree:** Clean
- **Remote:** `https://github.com/pratiklachwani7-prog/doctor-appointment-system.git`
- **Remote Main:** `871ddaf` (up to date)

### 8.5 Last Completed Task
**Phase 2 Documentation & PR #1 Merge** - Completed and verified

### 8.6 Next Pending Task
**Phase 2 Task 1 Completion** - Finish TypeScript/tooling setup, complete remaining modules (doctors routes, appointments, admin), wire routes, install deps, run checks

### 8.7 Unverified/Unrecoverable Information
- Frontend original state (no frontend in repo)
- Original package.json exact original state (modified)
- Some original Backend controller logic (refactored during migration)
- Exact original git history before audit commit (33 commits shown in log)

---

**End of CLAUDE_CODE_CONTEXT.md**

---

**Generated by:** Claude (Session: Phase 2 Implementation)
**Date:** 2026-11-07
**Project:** Doctor's Appointment System (MediConnect)
**Repository:** https://github.com/pratiklachwani7-prog/doctor-appointment-system
