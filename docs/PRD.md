# Product Requirements Document (PRD)

**Project:** MediConnect: Smart Healthcare Appointment & Clinic Management Platform  
**Version:** 1.0  
**Date:** 2026-11-06  
**Status:** Draft (based on Phase 1 audit of existing codebase)

---

## 1. Project Overview

### Vision
A production-grade, full-stack healthcare appointment platform that enables patients to book appointments with doctors, doctors to manage their schedules and consultations, and administrators to oversee the platform — all with robust concurrency control, role-based access, and modern engineering practices.

### Problem Statement
Healthcare appointment scheduling suffers from:
- Double-booking due to race conditions in concurrent bookings
- Poor patient experience (no real-time availability, no waitlist)
- Lack of doctor-facing tools (schedule management, consultation notes)
- Weak security (exposed secrets, no rate limiting, open CORS)
- No testing, documentation, or deployment pipeline

### Intended Outcomes
- **Patients:** Search doctors, view real-time slots, book/cancel/reschedule, view history, medical profile
- **Doctors:** Dashboard with calendar, manage availability/leave, confirm/complete appointments, write consultation notes
- **Admins:** Verify doctors, manage users, monitor appointments, analytics dashboard
- **Engineering:** Tested, documented, deployable codebase demonstrating senior full-stack skills

---

## 2. Target Audience & User Personas

| Persona | Goals | Pain Points |
|---------|-------|-------------|
| **Patient** | Book appointment quickly, see doctor availability, manage health records | Phone-only booking, no visibility into slots, double-booked appointments |
| **Doctor** | Manage schedule, see patient history, write notes, avoid overbooking | Paper calendars, no patient context, manual confirmation |
| **Admin** | Verify doctors, monitor platform health, view analytics | No dashboard, manual user management, no insights |

---

## 3. Business Objectives

1. **Portfolio Demonstration** — Showcase production-grade full-stack engineering
2. **Concurrency Control** — Prove double-booking prevention under load
3. **Security First** — Demonstrate OWASP-aware practices
4. **Clean Architecture** — Layered, testable, maintainable codebase
5. **Live Deployment** — Working demo with real infrastructure

---

## 4. Functional Requirements

### 4.1 Patient Portal (Phase 5)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-P1 | Register/Login with email + password | P0 |
| FR-P2 | Search doctors by specialty, name, availability | P0 |
| FR-P3 | View doctor profile (bio, fees, schedule, reviews) | P0 |
| FR-P4 | View real-time available slots for date range | P0 |
| FR-P5 | Book appointment (select slot, confirm, pay) | P0 |
| FR-P6 | Cancel appointment (with cutoff window) | P0 |
| FR-P7 | Reschedule appointment | P1 |
| FR-P8 | View appointment history (upcoming/past) | P0 |
| FR-P9 | Manage profile & medical history | P1 |
| FR-P10 | In-app notifications (booking confirm, reminders) | P1 |
| FR-P11 | Waitlist for full slots | P2 |

### 4.2 Doctor Dashboard (Phase 5)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-D1 | Login with doctor credentials | P0 |
| FR-D2 | Today/Week calendar view with appointments | P0 |
| FR-D3 | Manage weekly working hours, breaks, slot duration | P0 |
| FR-D4 | Add/remove leave days | P0 |
| FR-D5 | Confirm/Complete/Cancel appointments | P0 |
| FR-D6 | View patient details (medical history, profile) | P0 |
| FR-D7 | Write consultation notes (private to doctor+patient) | P1 |
| FR-D8 | Set availability toggle | P1 |

### 4.3 Admin Dashboard (Phase 5)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | Admin login | P0 |
| FR-A2 | Verify/approve doctor applications | P0 |
| FR-A3 | Manage doctors (view, edit, deactivate) | P0 |
| FR-A4 | Manage patients (view, edit, deactivate) | P1 |
| FR-A5 | Monitor all appointments | P1 |
| FR-A6 | Analytics: bookings over time, busiest specialties, cancellation rate, revenue | P1 |

### 4.4 Core Booking Engine (Phase 4)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B1 | Doctor defines weekly schedule, breaks, slot duration, leave | P0 |
| FR-B2 | API generates available slots for doctor + date range | P0 |
| FR-B3 | **Double-booking prevention** via DB unique index + transactions | P0 |
| FR-B4 | Booking with business rules (cutoff, no past, no overlap) | P0 |
| FR-B5 | Cancel appointment (frees slot, notifies waitlist) | P0 |
| FR-B6 | Reschedule appointment | P1 |
| FR-B7 | Status lifecycle: PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW | P0 |
| FR-B8 | Waitlist: auto-notify first waitlisted patient on cancellation | P1 |
| FR-B9 | Concurrency test: N simultaneous requests → exactly 1 succeeds | P0 |

### 4.5 Authentication & Roles (Phase 3)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH1 | Register/Login with bcrypt/argon2 hashed passwords | P0 |
| FR-AUTH2 | Short-lived access tokens + refresh tokens | P0 |
| FR-AUTH3 | Three roles: Patient, Doctor, Admin with RBAC middleware | P0 |
| FR-AUTH4 | Doctor accounts require admin verification | P0 |
| FR-AUTH5 | Password reset flow (email token) | P1 |
| FR-AUTH6 | Rate limiting on auth routes | P0 |
| FR-AUTH7 | Secure headers (Helmet), proper CORS | P0 |

### 4.6 Advanced Features (Phase 6 - Optional/Stretch)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADV1 | Email notifications (confirm, reminders 24h/1h, cancellation) | P2 |
| FR-ADV2 | Background job queue (BullMQ) for notifications | P2 |
| FR-ADV3 | Audit log of sensitive actions | P2 |
| FR-ADV4 | Redis caching for doctor search / slot lookups | P2 |
| FR-ADV5 | Razorpay/Stripe test mode payments with webhooks | P2 |
| FR-ADV6 | Video consultation link generation | P3 |
| FR-ADV7 | PDF prescription/consultation summary | P3 |

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | API response time (p95) | < 200ms |
| **Performance** | Slot generation for 30 days | < 500ms |
| **Performance** | Concurrent booking test (100 req) | < 2s, exactly 1 success |
| **Scalability** | Horizontal scaling ready (stateless API) | Yes |
| **Security** | OWASP Top 10 addressed | Yes |
| **Security** | Secrets in env only, never in code | Yes |
| **Security** | Rate limiting on auth endpoints | 10 req/min |
| **Reliability** | Uptime target | 99.9% |
| **Reliability** | Automated backups (MongoDB Atlas) | Yes |
| **Maintainability** | Test coverage (backend business logic) | ≥ 70% |
| **Maintainability** | TypeScript strict mode | Yes |
| **Maintainability** | ESLint + Prettier passing | Yes |
| **Deployability** | Single command local dev (`docker compose up`) | Yes |
| **Deployability** | CI/CD pipeline (GitHub Actions) | Yes |
| **Accessibility** | WCAG 2.1 AA (frontend) | Yes |

---

## 6. Core Features & Priorities

| Phase | Features | Status |
|-------|----------|--------|
| **Phase 1** | Audit complete | ✅ Done |
| **Phase 2** | Foundation (TS, layers, validation, Docker, seed, tests) | 🔄 In Progress |
| **Phase 3** | Auth + Roles (JWT, RBAC, verification, rate limit) | ⏳ Planned |
| **Phase 4** | Booking Engine (availability, slots, concurrency, waitlist) | ⏳ Planned |
| **Phase 5** | Frontend (Patient, Doctor, Admin portals) | ⏳ Planned |
| **Phase 6** | Advanced (notifications, queue, cache, payments, video, PDF) | ⏳ Optional |
| **Phase 7** | Quality (tests, CI, TypeScript, Swagger, security, perf) | ⏳ Planned |
| **Phase 8** | Deployment + Presentation (live demo, docs, resume) | ⏳ Planned |

---

## 7. Scope & Out-of-Scope

### In Scope (MVP for Portfolio)
- All Phase 2-5 requirements
- Phase 6 items marked P2 (notifications, queue, cache)
- Live deployment with demo credentials

### Out of Scope
- Real patient medical data (synthetic only)
- Insurance integration
- Multi-clinic/hospital support
- Telemedicine platform (video is link generation only)
- Mobile apps (responsive web only)
- HIPAA/GDPR compliance (educational demo only)

---

## 8. Constraints, Assumptions & Risks

### Constraints
- **Stack:** Node/Express, MongoDB/Mongoose, TypeScript (Decisions 1-3)
- **Database:** MongoDB Atlas (existing), local replica set for dev
- **Auth:** JWT cookies (access + refresh), bcrypt
- **Validation:** Zod schemas on every endpoint
- **Deployment:** Free/cheap hosting (Vercel + Render + Atlas)

### Assumptions
- Single timezone for MVP (Asia/Kolkata per environment)
- Synthetic seed data sufficient for demo
- Doctor verification is manual admin action
- Payment webhook testing via ngrok/local tunnel

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MongoDB transactions require replica set | High | High | Configure in docker-compose, verify Atlas |
| Double-booking under extreme load | Medium | High | Unique index + transactions + concurrency test |
| TypeScript migration breaks existing code | Medium | Medium | Incremental with `allowJs`, test each file |
| Frontend complexity exceeds timeline | Medium | High | Reuse components, Tailwind, React Query |
| Deployment costs exceed free tiers | Low | Medium | Monitor usage, optimize |

---

## 9. Acceptance Criteria (Definition of Done)

Per master prompt:
- [ ] `docker compose up` runs full system locally
- [ ] All three roles work end-to-end in live deployment
- [ ] Double-booking provably prevented by passing concurrency test
- [ ] CI green; tests, lint, API docs exist
- [ ] README makes recruiter understand + want to try in 60 seconds
- [ ] RESUME.md with 4-6 bullets, interview explanations, 10 Q&A

---

## 10. Future Enhancements (Post-MVP)

- Multi-language support
- Appointment reminders via SMS/WhatsApp
- Doctor ratings & reviews
- Recurring appointments
- Integration with EHR systems
- Mobile app (React Native)
- AI-powered symptom checker (pre-booking)
- Multi-tenant (clinic) support

---

*This PRD is derived from the Phase 1 audit of the existing codebase and the Master Prompt requirements. It will be updated as implementation progresses.*
