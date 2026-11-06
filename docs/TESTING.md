# Testing Strategy

**Project:** MediConnect (Doctor's Appointment System)
**Version:** 1.0
**Date:** 2026-11-06
**Status:** Draft — current state from Phase 1 audit; strategy planned for Phase 2-4

---

## 1. Current State (Verified)

- **Test framework:** None installed. `package.json` has no `test` script and no test dependencies.
- **Test files:** Zero. No `*.test.js`, `*.spec.js`, or `__tests__/` anywhere in the repository.
- **Coverage:** 0%.
- **CI:** None configured.

This is the single largest quality gap in the codebase. Every behavior in Phases 2–4 must be built test-first (see §3).

---

## 2. Test Stack (Planned, Phase 2)

| Layer | Tool | Purpose |
|-------|------|---------|
| Runner | Vitest | Fast, TS-native, ESM-friendly |
| HTTP integration | Supertest | Exercise Express routes end-to-end without listening on a port |
| DB isolation | mongodb-memory-server | In-memory MongoDB for integration tests; replica set mode for transaction tests |
| Assertions | Vitest `expect` | Built-in |
| Coverage | `vitest --coverage` (v8) | Enforce thresholds in CI |
| Mocking | `vi.mock` | For Cloudinary, Razorpay, email adapters |

> **Decision pending:** If `mongodb-memory-server` cannot emulate transactions reliably in CI, fall back to Testcontainers with a single-node replica set. Record the outcome in `docs/decision.md`.

---

## 3. Testing Workflow (TDD — Mandatory)

Per `test-driven-development` skill, applied to all new production code:

1. **RED** — Write a failing test that describes the desired behavior. Run it; confirm it fails for the expected reason (not a syntax/import error).
2. **GREEN** — Write the minimal production code that makes the test pass. No extra features.
3. **REFACTOR** — Clean up while all tests stay green. Re-run the full suite.
4. **REPEAT** — One behavior per cycle. Commit at green with a conventional message.

**No production code without a failing test first.** Exceptions require explicit approval and a note in the commit message.

### What counts as a behavior
- A service method's outcome (return value, thrown error, side effect)
- An endpoint's response (status, envelope shape, persistence effect)
- A validation rule (accept/reject)
- A state transition (allowed vs rejected)

### What does not need a new test
- Pure configuration (env parsing already covered by fail-fast test)
- Re-export/index files
- Type-only declarations

---

## 4. Test Levels

### 4.1 Unit Tests (services, validation, utilities)
- Scope: one module, dependencies mocked at the boundary (repositories mocked for services; services mocked for controllers).
- Location: `tests/unit/`.
- Naming: `<module>.test.ts`, e.g., `bookingService.test.ts`.
- Must cover: happy path, each error branch, boundary values.

### 4.2 Integration Tests (API endpoints + real database)
- Scope: route → controller → service → repository → in-memory MongoDB. Only external services (Cloudinary, Razorpay, email) are mocked.
- Location: `tests/integration/`.
- Naming: `<resource>.routes.test.ts`, e.g., `appointments.routes.test.ts`.
- Every endpoint gets at least: success case, validation failure case (400), unauthorized case (401), wrong-role case (403) where applicable, not-found case (404).

### 4.3 Concurrency Tests (Phase 4)
- 100 simultaneous booking requests for one slot → exactly 1 success, 99 conflict responses (409).
- Cancellation frees slot and notifies first waitlisted user.
- Run against in-memory replica set (transactions required).

### 4.4 End-to-End (Deferred — post-MVP)
- No E2E framework selected yet. TBD in Phase 5+ when a frontend exists.

---

## 5. Coverage Targets

| Area | Target | Enforcement |
|------|--------|-------------|
| Services (business logic) | ≥ 90% lines | CI gate |
| Routes/controllers | ≥ 80% lines | CI gate |
| Global | ≥ 80% lines | Reported, not enforced initially |
| Validation schemas | Every schema has accept + reject tests | PR checklist |

Coverage is a floor, not a goal. Untested error branches are the priority over chasing percentage.

---

## 6. Test Data & Fixtures

- Factories in `tests/fixtures/` create realistic synthetic entities (no real PII).
- Seed script (`scripts/seed.ts`) uses the same synthetic data source so dev and tests stay consistent.
- Each integration test suite gets a clean database (drop + seed in `beforeEach` or isolated DB name).

---

## 7. What Must Be Tested Before Each Phase Gate

### Phase 2 Gate
- [ ] Config module fails fast on missing env vars
- [ ] Health endpoint returns 200 with standard envelope
- [ ] Every endpoint rejects invalid input with 400 + standard error format
- [ ] Pagination returns correct page/limit/total metadata
- [ ] Centralized error handler never leaks stack traces in production mode
- [ ] Seed script runs and creates expected counts

### Phase 3 Gate
- [ ] Register/login success + failure (wrong password, unknown email)
- [ ] Tokens expire; refresh rotates and invalidates old refresh token
- [ ] Wrong role → 403; missing/invalid token → 401
- [ ] Rate limit triggers on auth routes
- [ ] Unverified doctors hidden from public search
- [ ] Password reset token single-use and expires

### Phase 4 Gate
- [ ] Slot generation correct around breaks and leave days
- [ ] Concurrency: 100 requests → 1 success
- [ ] Cancel frees slot; waitlist notification fires
- [ ] Invalid status transitions rejected (409)
- [ ] Patient cannot book overlapping appointments

---

## 8. Running Tests (Planned Commands)

```bash
npm test              # full suite (unit + integration)
npm run test:unit     # unit only
npm run test:integration  # integration only
npm run test:coverage # with coverage report
```

CI will run: lint → typecheck → test:coverage → build. Any failure blocks merge.

---

## 9. Rules

1. Tests live with the code change that requires them — same commit.
2. A bug fix starts with a failing regression test that reproduces the bug.
3. Flaky tests are bugs: fix or delete, never skip silently (no `.skip` without a linked issue).
4. Tests must not depend on execution order or shared mutable state.
5. No real credentials or PII in fixtures — synthetic data only.

---

## 10. Open Items (TBD)

- [ ] CI provider selection (GitHub Actions assumed)
- [ ] mongodb-memory-server vs Testcontainers for transaction tests
- [ ] E2E framework (post-frontend)
- [ ] Performance/load testing approach (Phase 5+)

---

*Derived from Phase 1 audit (zero tests found) and the mandatory TDD workflow. Updated as tests are added.*
