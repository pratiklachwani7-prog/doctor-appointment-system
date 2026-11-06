# AGENTS.md — Shared Instructions for AI Agents Working on This Repository

**Project:** MediConnect (Doctor's Appointment System)
**Version:** 1.0
**Date:** 2026-11-06
**Applies to:** Any AI agent (or human) modifying this repository

---

## 1. Read Order Before Doing Anything

1. `docs/PRD.md` — what we're building and why
2. `docs/ARCHITECTURE.md` — how the system is structured (current + target)
3. `docs/PHASE_PLAN.md` — what phase we're in and its gates
4. `docs/SECURITY.md` — security rules that are non-negotiable
5. `docs/TESTING.md` — TDD is mandatory for production code
6. `docs/flow.md` — current endpoint behavior and known bugs
7. `docs/CODE_STYLE.md` — style and conventions
8. `docs/decision.md` — locked technical decisions
9. `docs/CONSTRAINTS.md` — protected areas you must not touch

If a document is missing or contradicts the code, stop and flag it — do not guess.

---

## 2. Non-Negotiable Rules

1. **TDD:** Write a failing test first for every production behavior. No production code without a failing test. Exceptions require explicit user approval recorded in the commit message.
2. **Small commits:** One logical change per commit. Conventional Commits format (`feat|fix|docs|refactor|test|chore(scope): subject`).
3. **Documentation sync:** If a change affects behavior, schema, API, or config, update the matching doc in `docs/` in the same PR/commit series. Use `TBD` for unknowns — never invent facts.
4. **No secrets in code or commits:** Read configuration only from environment variables via the central config module. Never log or return passwords, tokens, or keys.
5. **Read before writing:** Inspect the actual file(s) before editing. Do not rewrite files from memory.
6. **No overwrites without instruction:** Never delete or replace existing work (code or docs) unless the task explicitly requires it. Check git status first.
7. **Stay in phase:** Do not implement features belonging to a later phase. Do not restart completed phases.
8. **Stop conditions:** Halt and ask when a change would be breaking, require a new major dependency, expose secrets, or contradict a locked decision in `docs/decision.md`.

---

## 3. Workflow (per task)

1. **Understand:** Read the relevant docs and code. Restate the goal and constraints in one paragraph.
2. **Plan:** Break into smallest steps. List verification for each.
3. **Test first:** Write failing tests (RED).
4. **Implement:** Minimal code to pass (GREEN).
5. **Refactor:** Clean up with tests staying green.
6. **Verify:** Run lint, typecheck, tests, and any phase-specific checks. Evidence before claims — paste command output when reporting.
7. **Document:** Update affected docs and `docs/COMMIT_LOG.md`.
8. **Commit:** Conventional commit; log the entry with the real hash.
9. **Report:** Status, next step, open questions. Update `docs/HANDOVER.md` when pausing.

---

## 4. Repository Layout (target, Phase 2+)

```
src/
  config/        # env parsing, db, cloudinary, logger
  modules/
    auth/        # routes, controller, service, repository, schemas
    users/
    doctors/
    appointments/
    admin/
    payments/
  shared/        # errors, response helpers, middlewares, types
  app.ts         # express app wiring
  server.ts      # bootstrap
tests/
  unit/ integration/ fixtures/
scripts/         # seed, migrate
docs/            # this documentation set
Backend/         # legacy code — frozen during migration, then removed
```

- New code goes in `src/` in TypeScript. `Backend/` is the legacy surface; migrate incrementally, do not extend it.
- One module = routes → controller → service → repository. Controllers stay thin (HTTP only). Business logic lives in services. Data access only in repositories.

---

## 5. Git Rules

- Branch per phase: `phase-2-foundation`, `phase-3-auth-roles`, `phase-4-booking-engine`.
- Pull/rebase before starting; never force-push shared branches without approval.
- Commit messages: subject ≤ 72 chars, imperative mood, body explains why.
- Every commit gets an entry in `docs/COMMIT_LOG.md` (format already established there).
- `.env` must never be tracked. If you find it tracked, flag it — do not commit around it.

---

## 6. Testing Expectations

- Vitest for unit + integration; Supertest for HTTP; mongodb-memory-server for DB isolation.
- Every endpoint test: success, validation failure (400), auth failure (401), role failure (403) where applicable, not-found (404).
- Services: happy path + every error branch + boundaries.
- Concurrency tests for booking (Phase 4).
- No `.skip` without a linked issue in `docs/BUG.md`.

---

## 7. Error & Response Standards

- Standard envelope: `{ success: boolean, data?: ..., error?: { code, message, details? } }`.
- 4xx = client fault; 5xx = server fault. Never leak stack traces or internal messages in production.
- Auth failures: generic messages; no user-existence disclosure.
- Use the centralized error handler and typed error classes; do not hand-roll `res.status(500).json(...)` in controllers.

---

## 8. Security Expectations

Follow `docs/SECURITY.md` without exception. In particular:

- Validate all input with Zod at the route boundary.
- Passwords: bcrypt cost 12; never returned, never logged.
- Tokens: short-lived access + rotating refresh; cookies `HttpOnly`, `Secure` (prod), `SameSite=Lax`.
- RBAC middleware on every protected route; role claim only — never credential comparison.
- Rate limiting on auth routes; Helmet; CORS allow-list.
- Audit-log sensitive actions (auth, booking, payment, admin changes).

---

## 9. Definition of Done (per change)

- [ ] Failing test existed first; now green
- [ ] Full suite passes; lint + typecheck clean
- [ ] No secrets in diff; `npm audit` unchanged or better
- [ ] Affected docs updated (`docs/`)
- [ ] Commit log entry added with real hash
- [ ] No regressions in previously passing tests

---

## 10. When Stuck

1. Re-read the relevant doc; the answer is usually there.
2. Check `docs/BUG.md` and `docs/HANDOVER.md` for known issues and prior context.
3. If still blocked: stop, state the exact blocker, list what you tried, and ask. Do not improvise around a blocker.
