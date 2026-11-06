# Constraints & Protected Areas

**Project:** MediConnect (Doctor's Appointment System)
**Version:** 1.0
**Date:** 2026-11-06
**Status:** Draft

---

## 1. Protected Areas (Do Not Modify Without Explicit Approval)

| Area | Why it's protected | Approval needed from |
|------|--------------------|----------------------|
| `Backend/.env` (and any secret file) | Contains live credentials; exposure risk | Repository owner |
| `docs/decision.md` locked decisions | Changing stack/architecture mid-phase causes churn | Repository owner |
| `docs/PRD.md` scope | Scope creep breaks phase planning | Repository owner |
| Database schema changes to existing collections | Data loss/migration risk | Repository owner + migration plan |
| Payment flows (`paymentRazerPay`, `verifyRazorpay`) | Money movement; bugs have real cost | Repository owner + tests |
| Anything in `docs/` marked "locked" | Source of truth for the workflow | Repository owner |

**Rule:** If a task requires touching a protected area, stop and ask first. State what you want to change and why.

---

## 2. Hard Technical Constraints

1. **No secrets in git.** `.env` stays untracked; `.env.example` carries placeholders only. (C1 remediation tracked in `docs/SECURITY.md` §3.1.)
2. **No production code without a failing test first** (TDD). Exceptions need explicit approval.
3. **No new major dependency** without a decision entry in `docs/decision.md`.
4. **No breaking API changes** within `/api/v1`; breaking changes go to `/api/v2`.
5. **No direct DB access outside repositories** — controllers/services never call Mongoose models directly after the Phase 2 restructure.
6. **No `console.log` in production code** — use the structured logger (pino).
7. **No credentials or PII in logs or error responses.**
8. **MongoDB transactions require a replica set** — booking logic must run against a replica set (Docker local, Atlas production). Standalone MongoDB cannot be used for Phase 4.
9. **Node.js 18+**, TypeScript strict mode for all new/migrated files during migration.
10. **Existing `Backend/` code is frozen** during migration: bug fixes allowed with tests, but no new features there.

---

## 3. Process Constraints

1. Work happens on phase branches only (`phase-2-foundation`, etc.). No direct commits to `main`.
2. Every commit is logged in `docs/COMMIT_LOG.md` with the real hash — no placeholders.
3. Documentation updates ship with the code change they describe, not later.
4. Phase gates in `docs/PHASE_PLAN.md` must pass before moving to the next phase.
5. Stop conditions (from the workflow): failing gate that can't be fixed, breaking change required, secret exposure found, external information needed.
6. 20 pre-existing modified files in `Backend/` are user-owned work-in-progress — leave them untouched unless the task explicitly covers them. Do not commit or revert them without instruction.

---

## 4. Assumptions & Unknowns (TBD)

- [ ] Deployment target (Render/Vercel/other) not finalized — record in `docs/decision.md` when decided.
- [ ] Email provider for password reset not selected.
- [ ] GDPR/HIPAA applicability depends on launch jurisdiction — see `docs/SECURITY.md` §5.
- [ ] CI provider assumed GitHub Actions — confirm.
- [ ] Frontend stack not started; `docs/DESIGN_SYSTEM.md` intentionally absent until frontend work begins.

---

## 5. Scope Boundaries

**In scope (Phases 2–4):** backend foundation, auth + RBAC, booking engine, waitlist, payments verification, tests, Docker dev environment.

**Out of scope for now:** frontend application, video consultations, notification delivery channels (email/SMS providers), analytics dashboards, multi-tenancy, mobile apps. These are listed as future enhancements in `docs/PRD.md` — do not implement early.
