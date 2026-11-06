# Security Policy & Hardening Plan

**Project:** MediConnect (Doctor's Appointment System)
**Version:** 1.0
**Date:** 2026-11-06
**Status:** Draft — grounded in Phase 1 audit findings (`docs/AUDIT.md` §5) + planned Phase 2–4 controls
**Owner:** TBD (project maintainer)

---

## 1. Purpose & Scope

This document defines the security posture for the MediConnect API: known vulnerabilities found in the Phase 1 audit, the controls planned to fix them, secrets-management rules, and the verification checks that must pass before each phase is considered complete.

Scope: the Express/MongoDB backend in `Backend/` (to be migrated to `src/` in TypeScript during Phase 2) and any future frontend that consumes the API. Out of scope: infrastructure managed by third parties (MongoDB Atlas, Cloudinary, Razorpay) beyond configuration choices we control.

---

## 2. Current Security State (from Audit — Verified Against Code)

### 2.1 Critical Issues (Must Fix — Blocking for any production use)

| # | Issue | Evidence Location | Risk |
|---|-------|-------------------|------|
| C1 | Real secrets committed to Git | `Backend/.env` tracked in repository | MongoDB URI, Cloudinary keys, `JWT_SECRET`, Razorpay keys, admin credentials exposed |
| C2 | Weak `JWT_SECRET` | `Backend/.env` → `JWT_SECRET="PRATIK"` | Trivially brute-forceable; access tokens forgeable |
| C3 | Admin auth uses string comparison of credentials | `Backend/middlewares/authadmin.js` | Token embeds `ADMIN_EMAIL + ADMIN_PASSWORD`; comparison bypassable and credentials leak in token payload |
| C4 | No rate limiting | All auth endpoints | Brute force, credential stuffing, DoS |
| C5 | CORS completely open | `Backend/server.js` (`app.use(cors())`) | Any origin can call API with credentials |
| C6 | No security headers | `Backend/server.js` | Missing Helmet/CSP/HSTS/X-Frame-Options |
| C7 | Cookies lack secure flags | Controllers (`res.cookie(...)`) | Missing `secure: true`, `sameSite` set to `lax` without explicit policy |

### 2.2 High Issues

| # | Issue | Location |
|---|-------|----------|
| H1 | No schema-based input validation (manual checks only) | All controllers |
| H2 | No refresh-token mechanism; access tokens never expire | Auth controllers |
| H3 | Password reset flow not implemented | — |
| H4 | Doctor role authentication missing | No doctor login/endpoints |
| H5 | No authorization checks on doctor data | `doctorList` public |
| H6 | Potential NoSQL injection surface | Controllers (mitigated partially by Mongoose; not validated) |

### 2.3 Medium Issues

| # | Issue |
|---|-------|
| M1 | Error responses leak stack traces in production (`console.log(err)`) |
| M2 | No audit logging for sensitive actions (login, booking, payment) |
| M3 | Razorpay key secret empty in `.env` (payment integration incomplete) |
| M4 | No API versioning (`/api/v1/...`) |

> **Note:** These are historical findings from the committed audit. Fix status will be tracked in `docs/BUG.md` as each phase lands. Do not mark an item fixed here until its verification check in §7 passes.

---

## 3. Secrets Management

**Rule: No secret ever enters the repository. `.env` must never be tracked.**

- `.env` is gitignored; `Backend/.gitignore` already excludes it. **C1 remains open because the file was committed in earlier history** — see §3.1.
- A `.env.example` file will be committed with all required keys and placeholder values only.
- Secret rotation required after C1 remediation (any secret that ever appeared in git history must be considered compromised).

### 3.1 Remediation Plan for C1 (Committed Secrets)

1. Rotate all exposed credentials: MongoDB user password, Cloudinary API key/secret, Razorpay key secret, admin password, and `JWT_SECRET` (generate 256-bit random).
2. Remove `.env` from the working tree tracking (`git rm --cached Backend/.env`) and commit.
3. Purge history (BFG Repo-Cleaner or `git filter-repo`) before any public release; force-push and notify collaborators to re-clone. **Timing: before repository is made public.**
4. Verify no secret remains in `git log -p` output.

### 3.2 Environment Variables (Required)

| Variable | Purpose | Secret? |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | Yes |
| `JWT_SECRET` | Token signing (≥ 256-bit random) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing | Yes |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads | Key/secret yes |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments | Secret yes |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Admin bootstrap (hash, never plaintext) | Yes |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | No |
| `PORT`, `NODE_ENV`, `LOG_LEVEL` | Runtime config | No |

---

## 4. Planned Security Controls (by Phase)

### 4.1 Phase 2 (Foundation)
- Centralized env config module that **fails fast** on missing required variables (no silent defaults for secrets).
- Zod validation on every endpoint (body, query, params) — closes H1/H6 partially.
- Centralized error handler that never leaks stack traces or internal messages in production (`NODE_ENV=production`) — closes M1.
- Standard API response format that never includes password fields — passwords excluded at the repository/serializer layer.
- `npm audit` reviewed at the gate; high/critical findings must be resolved or documented with justification.
- Health endpoint `/api/v1/health` exposes no internal details beyond status/uptime/version.

### 4.2 Phase 3 (Auth & Roles)
- Passwords hashed with bcrypt, cost factor 12. Plaintext passwords never logged, never returned, never stored.
- Access tokens: 15-minute expiry, signed with strong `JWT_SECRET` — closes C2/H2.
- Refresh tokens: 7-day expiry, rotation on use, stored as HttpOnly cookie — closes H2.
- Cookies set with `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'` — closes C7.
- Admin auth replaced: admin identified by role claim in JWT, never by string-concatenated credentials — closes C3.
- RBAC middleware: `PATIENT`, `DOCTOR`, `ADMIN`; every protected route declares its allowed roles — closes H4/H5.
- Rate limiting on auth routes (e.g., 10 requests/minute per IP) — closes C4.
- Helmet with sensible defaults; CORS restricted to configured origins — closes C5/C6.
- Password reset via single-use, time-limited email token — closes H3.
- Audit logging for login success/failure, password changes, booking, cancellation, payment events — closes M2.

### 4.3 Phase 4 (Booking Engine)
- Booking creation runs in a MongoDB transaction; unique compound index `(doctorId, slotStart)` with partial filter `{cancelled: false}` prevents double-booking under concurrency.
- Status transitions validated against an allow-list; invalid transitions rejected with 409.
- All slot/cancellation endpoints enforce ownership (patient can only cancel own appointment; doctor only own schedule).

---

## 5. Data Protection

| Data | Classification | Handling |
|------|---------------|----------|
| Passwords | Secret | bcrypt hash only; never returned by any endpoint |
| Patient PII (name, email, phone, DOB, address) | Confidential | Returned only to the owning patient, their doctor(s), and admins |
| Medical appointment details | Confidential | Access limited by RBAC + ownership checks |
| Payment identifiers | Sensitive | Razorpay handles card data; we store only order/payment IDs |
| JWT secrets, API keys | Secret | Env vars only; rotated on exposure |

- Transport: HTTPS enforced in production (HSTS via Helmet); local dev may run HTTP.
- At rest: MongoDB Atlas encryption at rest (provider-managed); backups encrypted by provider. Local Docker volume is not encrypted (dev only).
- Retention: TBD — no retention policy exists yet; flag for product decision.
- GDPR/HIPAA applicability: TBD — depends on deployment jurisdiction; document in PRD once decided.

---

## 6. API Security Rules

1. **Validation:** Every endpoint validates input with Zod schemas; unknown fields stripped; types coerced strictly.
2. **Responses:** Standard envelope `{ success, data | error: { code, message, details? } }`; never include stack traces, internal paths, or secrets.
3. **Errors:** 4xx for client errors, 5xx for server errors; auth failures return generic messages (no user-existence disclosure).
4. **Versioning:** All routes under `/api/v1`; breaking changes require `/api/v2`.
5. **Uploads:** Multer + Cloudinary; validate MIME type and size limits; never trust client-provided filenames.
6. **Rate limits:** Auth endpoints strict (10/min/IP); general API moderate (100/min/IP) — TBD tuning.
7. **Headers:** Helmet defaults + explicit CORS allow-list; no `X-Powered-By`.

---

## 7. Verification Checklist (per gate)

- [ ] No secrets in `git diff` or tracked files (C1 remediation tracked separately)
- [ ] `npm audit` — no unresolved high/critical
- [ ] Passwords absent from all responses and logs
- [ ] Stack traces absent from production error responses
- [ ] Every endpoint rejects invalid input (Zod) with 400 + standard error format
- [ ] Rate limiting active on auth routes
- [ ] CORS rejects non-allow-listed origins
- [ ] Helmet headers present on all responses
- [ ] Cookies carry `HttpOnly`, `Secure`, `SameSite` flags
- [ ] RBAC enforced: wrong role → 403; unauthenticated → 401
- [ ] Admin authorization no longer uses credential string comparison

---

## 8. Incident Response (Minimal)

1. **Detect:** structured logs + alerting (Phase 2 logging; alerting TBD).
2. **Contain:** revoke/rotate affected credentials; disable compromised accounts.
3. **Assess:** determine data exposure scope; preserve logs.
4. **Notify:** TBD — depends on jurisdiction and user agreements.
5. **Remediate & Review:** patch, add regression test, update this document.

---

## 9. Dependency & Supply Chain

- Dependencies pinned via `package-lock.json`; reviewed with `npm audit` each phase gate.
- Major upgrades require a decision entry in `docs/decision.md`.
- No new dependency without a stated purpose in the PR/commit message.

---

## 10. Open Items (TBD)

- [ ] Retention policy and GDPR/HIPAA applicability
- [ ] Alerting/incident notification process
- [ ] Secret rotation runbook execution (blocked on C1 remediation window)
- [ ] Penetration test scope (post-MVP)

---

*This document reflects verified Phase 1 audit evidence and planned controls. It will be updated as each phase lands and its verification checks pass.*
