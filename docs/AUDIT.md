# Project Audit: Doctor's Appointment System

**Date:** 2026-11-06  
**Auditor:** AI Assistant (Claude)  
**Repository:** https://github.com/pratiklachwani7-prog/doctor-appointment-system  
**Branch:** main (33 commits)

---

## 1. Tech Stack Detected

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Runtime | Node.js | — | ES Modules (`"type": "module"`) |
| Framework | Express | 5.2.1 | Latest major version |
| Database | MongoDB | — | Atlas hosted |
| ODM | Mongoose | 9.9.4 | |
| Authentication | JWT (jsonwebtoken) | 9.0.3 | Cookie-based, no refresh tokens |
| Password Hashing | bcrypt | 6.0.0 | 10 rounds |
| File Upload | multer | 2.3.0 | Disk storage → Cloudinary |
| Image Hosting | Cloudinary | 2.11.0 | |
| Payments | Razorpay | 2.9.8 | Test mode |
| Validation | validator | 13.15.35 | Manual validation in controllers |
| Cookies | cookie-parser | 1.4.7 | |
| CORS | cors | 2.8.6 | Open (no origin restriction) |
| Environment | dotenv | 17.4.2 | |
| Dev Tool | nodemon | 3.1.14 | |

**Package Manager:** npm (package-lock.json present)

**Folder Structure:**
```
Project 8 Doctor's Appointment System/
├── Backend/
│   ├── config/          # DB & Cloudinary connections
│   ├── controller/      # Business logic (user, doctor, admin)
│   ├── middlewares/     # Auth (user, admin), multer
│   ├── models/          # Mongoose models (user, doctor, appointment)
│   ├── routes/          # Express routers (user, doctor, admin)
│   ├── server.js        # Entry point
│   ├── .env             # ⚠️ COMMITTED WITH SECRETS
│   ├── .gitignore       # Ignores .env, node_modules
│   ├── package.json
│   └── API.md           # Basic API documentation
├── docs/                # Empty (to be populated)
├── README.md            # Nearly empty ("# Doctor")
└── *.webp               # Stray asset file
```

---

## 2. Architecture Summary

### Request Flow
```
Client Request
    │
    ▼
Express App (server.js)
    │
    ├── cors(), express.json(), cookieParser()
    │
    ├── /api/admin/*  ──► adminRouter ──► adminController ──► Models
    ├── /api/doctor/* ──► doctorRouter ─► doctorController ─► Models
    └── /api/user/*   ──► userRouter ───► userController ───► Models
    │
    ▼
MongoDB (via Mongoose)
```

### Mermaid Diagram: Current Structure

```mermaid
flowchart TD
    subgraph Client[Client / Frontend]
        C[Browser / API Client]
    end

    subgraph Server[Express Server]
        MW[Middleware Stack]
        MW -->|express.json| BodyParser[Body Parser]
        MW -->|cookie-parser| CookieParser[Cookie Parser]
        MW -->|CORS| CORS[CORS - Open]
        
        subgraph Routes[API Routes]
            AR[/api/admin/*]
            DR[/api/doctor/*]
            UR[/api/user/*]
        end
        
        subgraph Controllers[Controllers - Business Logic]
            AC[adminController.js]
            DC[doctorController.js]
            UC[userController.js]
        end
        
        subgraph Middleware[Auth Middleware]
            AM[authAdmin.js]
            UM[authUser.js]
        end
        
        subgraph Models[Mongoose Models]
            UM_Model[User Model]
            DM_Model[Doctor Model]
            APM_Model[Appointment Model]
        end
    end
    
    subgraph External[External Services]
        MDB[(MongoDB Atlas)]
        CLD[Cloudinary]
        RP[Razorpay]
    end

    C --> MW
    MW --> AR
    MW --> DR
    MW --> UR
    
    AR --> AM
    AM --> AC
    DR --> DC
    UR --> UM
    UM --> UC
    
    AC --> UM_Model
    AC --> DM_Model
    DC --> DM_Model
    UC --> UM_Model
    UC --> DM_Model
    UC --> APM_Model
    
    UM_Model --> MDB
    DM_Model --> MDB
    APM_Model --> MDB
    
    AC --> CLD
    UC --> CLD
    UC --> RP
```

---

## 3. Existing Features

| Feature | Endpoint(s) | Status | Notes |
|---------|-------------|--------|-------|
| **User Registration** | `POST /api/user/register` | ✅ Working | JWT cookie set, password hashed |
| **User Login** | `POST /api/user/login` | ✅ Working | Returns JWT in cookie + body |
| **Get Profile** | `GET /api/user/get-profile` | ✅ Working | Protected by `authUser` |
| **Update Profile** | `POST /api/user/update-profile` | ✅ Working | Image upload to Cloudinary |
| **Doctor Listing (Public)** | `GET /api/doctor/list` | ✅ Working | Excludes password & email |
| **Book Appointment** | `POST /api/user/book-appointment` | ⚠️ Partial | No concurrency control, race condition risk |
| **List Appointments** | `GET /api/user/appointments` | ✅ Working | Returns all user appointments |
| **Cancel Appointment** | `POST /api/user/cancel-appointment` | ✅ Working | Releases doctor slot |
| **Razorpay Payment** | `POST /api/user/payment-razorpay` | ✅ Working | Creates order |
| **Verify Payment** | `POST /api/user/verify-razorpay` | ✅ Working | Updates appointment payment status |
| **Admin Login** | `POST /api/admin/login` | ✅ Working | Simple env-based credentials |
| **Add Doctor** | `POST /api/admin/add-doctor` | ✅ Working | Image upload, password hashed |
| **List All Doctors (Admin)** | `GET /api/admin/all-doctors` | ✅ Working | Excludes password |
| **Toggle Doctor Availability** | `POST /api/admin/change-availability` | ✅ Working | Admin only |

### Roles Implemented
| Role | Auth Method | Permissions |
|------|-------------|-------------|
| **Patient (User)** | JWT cookie (`loginToken`) | Book/cancel appointments, profile, payments |
| **Admin** | JWT cookie (`token`) + header | Manage doctors, view all, toggle availability |
| **Doctor** | ❌ **NOT IMPLEMENTED** | No doctor-specific endpoints or auth |

---

## 4. Data Model Review

### Entities & Relationships

```mermaid
erDiagram
    USER ||--o{ APPOINTMENT : "books"
    DOCTOR ||--o{ APPOINTMENT : "receives"
    USER {
        string _id PK
        string name
        string email UK
        string password
        string image
        object address
        string gender
        string dob
        string phone
    }
    DOCTOR {
        string _id PK
        string name
        string email UK
        string password
        string image
        string speciality
        string degree
        string experience
        string about
        boolean available
        number fees
        object address
        date createdAt
        object slots_booked  // Denormalized: { "2024-01-15": ["10:00", "10:30"] }
    }
    APPOINTMENT {
        string _id PK
        string userId FK
        string docId FK
        string slotDate
        string slotTime
        object userData  // Denormalized snapshot
        object docData   // Denormalized snapshot
        number amount
        number date      // Timestamp
        boolean cancelled
        boolean payment
        boolean isCompleted
    }
```

### Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| **Denormalized slots_booked** | High | Doctor model stores booked slots as embedded object. No atomic operations, race conditions on concurrent bookings. |
| **No unique constraint on (docId, slotDate, slotTime)** | Critical | Double-booking prevention relies only on application-level check. |
| **Denormalized userData/docData in Appointment** | Medium | Snapshots duplicated; no sync if user/doctor profile changes. |
| **Missing indexes** | High | No indexes on `userId`, `docId`, `slotDate`, `slotTime` for query performance. |
| **`date` field as Number** | Low | Should be `Date` type for proper querying. |
| **`slots_booked` default bug** | Bug | Line 68 in userController: `slotsBooked[slotDate].push(slotDate)` pushes date string instead of slotTime. |
| **No foreign key references** | Medium | `userId` and `docId` are Strings, not ObjectId refs. |
| **Appointment status as multiple booleans** | Design | `cancelled`, `payment`, `isCompleted` — should be single `status` enum. |

---

## 5. Security Review

### Critical Issues (Must Fix)

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | **Real secrets committed to Git** | `Backend/.env` | MongoDB URI, Cloudinary keys, JWT_SECRET, Razorpay keys, Admin credentials exposed |
| 2 | **Weak JWT_SECRET** | `.env` → `JWT_SECRET="PRATIK"` | Trivially brute-forceable; tokens can be forged |
| 3 | **Admin auth uses simple string comparison** | `authadmin.js` line 33 | `decodedToken != process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD` — tokens contain email+password concatenated |
| 4 | **No rate limiting** | All auth endpoints | Brute force, credential stuffing, DoS |
| 5 | **CORS completely open** | `server.js` line 13 | `app.use(cors())` — any origin can call API with credentials |
| 6 | **No security headers** | `server.js` | No Helmet, no CSP, no HSTS, no X-Frame-Options |
| 7 | **Cookies lack secure flags** | Controllers | `res.cookie()` without `secure: true`, `sameSite: 'lax'` |

### High Issues

| # | Issue | Location |
|---|-------|----------|
| 8 | No input sanitization / validation schema | All controllers use manual `validator` checks |
| 9 | No refresh token mechanism | Access tokens never expire (no `expiresIn`) |
| 10 | Password reset flow missing | Not implemented |
| 11 | Doctor role authentication missing | No doctor login, no doctor-specific endpoints |
| 12 | No authorization checks on doctor data access | `doctorList` exposes all doctors publicly |
| 13 | Potential NoSQL injection | Mongoose helps but raw queries not used; still validate all inputs |

### Medium Issues

| # | Issue |
|---|-------|
| 14 | Error messages leak stack traces in production (console.log(err)) |
| 15 | No audit logging for sensitive actions |
| 16 | Razorpay key secret empty in .env |
| 17 | No API versioning (`/api/v1/...`) |

---

## 6. Code Quality Review

| Category | Assessment | Details |
|----------|------------|---------|
| **Structure** | ⚠️ Flat | Routes → Controllers → Models. No service layer, no DTOs, no separation of concerns. |
| **Duplication** | High | Validation logic repeated, error handling copy-pasted, response format inconsistent. |
| **Error Handling** | Poor | Try/catch in every function, generic 500s, "LOL" messages, no centralized handler. |
| **Naming** | Inconsistent | `bycrypt` (typo), `paymentRazerPay` (typo), `authUser` vs `authAdmin`, mixed casing. |
| **Dead Code** | Present | Commented `required` in doctor model, unused imports, commented debug logs. |
| **Validation** | Manual | No Zod/Joi/schema; each controller validates inline. |
| **Type Safety** | None | Plain JavaScript, no TypeScript, no JSDoc types. |
| **Testing** | None | `npm test` exits with error; no test files. |
| **Linting/Format** | None | No ESLint, Prettier, Husky. |
| **Documentation** | Minimal | Only `API.md` with basic endpoint list. |
| **Logging** | Console only | No structured logging, no levels, no correlation IDs. |

### Specific Code Smells

1. **userController.js:247** — `slotsBooked[slotDate].push(slotDate)` bug (pushes date not time)
2. **userController.js:281** — `delete docData.slots_booked` mutates mongoose document
3. **authadmin.js:33** — Token verification compares decoded JWT to env string concatenation
4. **adminController.js:82** — `message: "LOL"` as error response
5. **No transaction** for booking (check slot → create appointment → update doctor slots)

---

## 7. Gaps vs. Target Requirements

| Target Feature | Current Status | Gap |
|----------------|----------------|-----|
| **Multi-role (Patient, Doctor, Admin)** | Partial (Patient, Admin only) | Doctor role missing entirely |
| **Doctor Dashboard** | ❌ Missing | No doctor login, calendar, availability management, consultation notes |
| **Patient Portal** | Partial | Backend APIs exist; no frontend |
| **Availability Engine** | ❌ Missing | Only simple `available` boolean + `slots_booked` object |
| **Weekly Hours / Breaks / Leave** | ❌ Missing | Not modeled |
| **Slot Generation API** | ❌ Missing | Manual slot strings passed from frontend |
| **Double-Booking Prevention** | ❌ Broken | Race condition; no DB constraint/transaction |
| **Waitlist** | ❌ Missing | Not modeled |
| **Appointment Status Lifecycle** | Partial | Only `cancelled`, `payment`, `isCompleted` booleans |
| **Notifications (Email/In-App)** | ❌ Missing | No queue, no templates, no background jobs |
| **Audit Log** | ❌ Missing | Not implemented |
| **Caching (Redis)** | ❌ Missing | Not configured |
| **Payments (Test Mode)** | ✅ Partial | Razorpay integrated but no webhook handling, no idempotency |
| **Video Consultation Links** | ❌ Missing | Not implemented |
| **PDF Prescriptions** | ❌ Missing | Not implemented |
| **Frontend (React/Vite + Tailwind)** | ❌ Missing | No frontend at all |
| **Tests (Unit/Integration/E2E)** | ❌ Missing | Zero tests |
| **CI/CD (GitHub Actions)** | ❌ Missing | Not configured |
| **Docker / docker-compose** | ❌ Missing | Not configured |
| **API Docs (Swagger/OpenAPI)** | ❌ Missing | Only markdown |
| **TypeScript** | ❌ Missing | Plain JS |
| **Security Hardening** | ❌ Missing | Multiple critical issues |
| **Deployment Config** | ❌ Missing | No Vercel/Render/Neon setup |

---

## 8. Risk List & Prioritized Roadmap

### Critical (Do First) — Week 1-2

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 1 | **Rotate all leaked secrets** (MongoDB, Cloudinary, JWT, Razorpay, Admin) | 1h | Immediate — before any other work |
| 2 | **Add strong JWT_SECRET, token expiry, refresh tokens** | 4h | Auth refactor |
| 3 | **Fix double-booking: add unique index + transaction** | 8h | Model change, migration |
| 4 | **Implement rate limiting on auth endpoints** | 2h | express-rate-limit |
| 5 | **Configure CORS with specific origins, add Helmet** | 2h | |
| 6 | **Secure cookies (secure, sameSite, httpOnly)** | 1h | |
| 7 | **Add root .gitignore, ensure .env never committed** | 1h | |

### High — Week 2-4

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 8 | **Restructure: Routes → Controllers → Services → Data Access** | 16h | Foundation phase |
| 9 | **Add Zod validation schemas for all endpoints** | 8h | |
| 10 | **Centralized error handling + consistent API response format** | 4h | |
| 11 | **Environment config management (config module)** | 4h | |
| 12 | **Health check endpoint + structured logging (pino/winston)** | 4h | |
| 13 | **Database: proper relations, indexes, migrations, seed script** | 12h | |
| 14 | **API versioning (`/api/v1`), pagination, filtering, sorting** | 8h | |
| 15 | **Docker Compose (API + MongoDB + Frontend placeholder)** | 8h | |
| 16 | **Doctor role: registration, login, JWT, authorization middleware** | 16h | Auth refactor |

### Medium — Week 4-8

| # | Task | Effort |
|---|------|--------|
| 17 | **Availability engine: weekly hours, breaks, leave, slot generation** | 24h |
| 18 | **Waitlist mechanism** | 12h |
| 19 | **Appointment status enum + lifecycle transitions** | 8h |
| 20 | **Frontend: React + Vite + Tailwind + React Query** | 40h |
| 21 | **Patient portal: search, book, history, profile, notifications** | 40h |
| 22 | **Doctor dashboard: calendar, availability, notes, patient details** | 32h |
| 23 | **Admin dashboard: verify doctors, analytics charts** | 24h |
| 24 | **Background job queue (BullMQ) for notifications** | 16h |
| 25 | **Email templates + in-app notifications** | 12h |
| 26 | **Redis caching for doctor search / slots** | 8h |
| 27 | **Razorpay webhook handling + idempotency** | 8h |

### Low — Week 8-12

| # | Task | Effort |
|---|------|--------|
| 28 | **Video consultation links (Jitsi/Whereby/Zoom)** | 16h |
| 29 | **PDF prescription generation** | 8h |
| 30 | **Unit tests (services), Integration tests (API), E2E (Playwright)** | 40h |
| 31 | **CI/CD: GitHub Actions (lint, type-check, test, build Docker)** | 16h |
| 32 | **TypeScript migration** | 24h |
| 33 | **Swagger/OpenAPI at `/api/docs`** | 8h |
| 34 | **Security audit: dependency scan, OWASP checklist** | 8h |
| 35 | **Performance: query review, index verification** | 8h |
| 36 | **Deployment to Vercel + Render + Neon/Supabase** | 16h |
| 37 | **Professional README, ARCHITECTURE.md, API.md, DECISIONS.md** | 16h |
| 38 | **LICENSE, CONTRIBUTING.md, issue/PR templates** | 4h |
| 39 | **Demo script + video outline** | 4h |
| 40 | **RESUME.md with interview prep** | 8h |

---

## 9. Questions for Decision

Before proceeding, I need your input on:

1. **Stack Confirmation**: Keep Node/Express/MongoDB? Any preference for TypeScript migration now vs later?
2. **Auth Approach**: JWT cookies (current) or sessions? Access + refresh tokens or just short-lived access?
3. **Frontend Framework**: React + Vite (recommended) or Next.js? Tailwind CSS confirmed?
4. **Database**: Stay with MongoDB Atlas or migrate to PostgreSQL (better for relational data, transactions)?
5. **Doctor Registration Flow**: 
   - Option A: Doctors self-register → Admin verifies → Appear in search
   - Option B: Admin creates doctor accounts directly (current)
   - Option C: Both (admin can create, doctors can apply)
6. **Payment Scope**: Keep Razorpay test mode only, or add Stripe for international demo?
7. **Video Consultation**: Include in MVP or mark as "future enhancement"?
8. **PDF Generation**: Include prescription PDF or skip for portfolio?
9. **Deployment Targets**: 
   - Frontend: Vercel (recommended)
   - Backend: Render / Railway / Fly.io
   - Database: MongoDB Atlas (current) or Neon (PostgreSQL) / Supabase
10. **Timeline**: Any hard deadlines for portfolio completion?

---

## Appendix: File Inventory (Backend)

```
Backend/
├── config/
│   ├── cloudinary.js      # Cloudinary config
│   └── mongodb.js         # Mongoose connection
├── controller/
│   ├── adminController.js # Add doctor, admin login, list doctors
│   ├── doctorController.js# List doctors, toggle availability
│   └── userController.js  # Auth, profile, appointments, payments
├── middlewares/
│   ├── authUser.js        # Patient JWT verification
│   ├── authadmin.js       # Admin JWT verification
│   └── multer.js          # File upload config
├── models/
│   ├── appointment.model.js
│   ├── doctor.model.js
│   └── user.model.js
├── routes/
│   ├── admin.route.js
│   ├── doctor.route.js
│   └── user.route.js
├── server.js              # Express entry point
├── package.json
├── package-lock.json
├── .env                   # ⚠️ SECRETS COMMITTED
├── .gitignore
├── API.md
├── LEARNINGS1.md
├── LEARNINGS2.md
├── LEARNINGS3.md
└── Multer_Cloudinary.md
```

---

**End of Audit**  
*Ready for Phase 2 (Foundation) upon approval.*
