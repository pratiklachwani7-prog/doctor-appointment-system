# Technical Decision Log

This document records significant technical decisions made during the project transformation.

---

## Decision 1: Language — TypeScript (Incremental Migration)

**Date:** 2026-11-06  
**Status:** Accepted  
**Context:** The existing Backend is plain JavaScript (ES modules). The portfolio requires TypeScript for demonstration of type safety skills.

**Options Considered:**
1. **Big-bang rewrite to TypeScript** — High risk, breaks existing functionality, difficult to verify
2. **Incremental migration with `allowJs`** — Lower risk, can migrate file-by-file, maintain working app
3. **Stay with JavaScript + JSDoc** — No migration effort, but weaker type safety signal for portfolio

**Selected Approach:** Option 2 — Incremental migration with `allowJs: true` during transition, `strict: true` on all new and migrated files.

**Reasoning:**
- Maintains working application throughout migration
- Demonstrates real-world TypeScript adoption skill
- `allowJs` lets TS and JS coexist; migrate critical files first (models, services, validators)
- New code written in TS from day one
- Portfolio can highlight "Incremental TS migration on existing Express/Mongo codebase"

**Consequences:**
- Need `tsconfig.json` with `allowJs: true`, `strict: true`, `esModuleInterop: true`
- Build step added (`tsc` or `tsx` for dev)
- Existing `.js` files compile but don't get strict checks until migrated
- Package.json scripts updated for `dev` (tsx watch) and `build` (tsc)

**Related Decisions:** Decision 2 (Zod works best with TS), Decision 3 (MongoDB/Mongoose has good TS support)

---

## Decision 2: Validation — Zod on Every Endpoint

**Date:** 2026-11-06  
**Status:** Accepted  
**Context:** Current validation is manual/inconsistent using `validator` package inline in controllers.

**Options Considered:**
1. **Joi** — Mature, works with JS, but verbose schema definition
2. **Zod** — TypeScript-first, infers types from schemas, composable, excellent DX
3. **class-validator + class-transformer** — Decorator-based, requires classes, heavier
4. **Manual validation** — Current state, inconsistent, no type inference

**Selected Approach:** Zod on every endpoint.

**Reasoning:**
- TypeScript integration: schemas infer `z.infer<typeof schema>` types for request/response
- Composable: `z.object()`, `z.array()`, `.extend()`, `.partial()`, `.pick()` for reuse
- Single source of truth: schema = validation + TypeScript types
- Lightweight, zero dependencies, fast
- Aligns with Decision 1 (TypeScript)

**Consequences:**
- Add `zod` dependency
- Create `schemas/` folder with request/response schemas per feature
- Middleware to validate `body`, `query`, `params` against schemas
- Standardized error response format for validation failures (400 with field-level details)
- Existing `validator` package can be removed after migration

**Related Decisions:** Decision 1 (Zod + TS = inferred types), Decision 5 (API response format)

---

## Decision 3: Database — Stay with MongoDB + Mongoose

**Date:** 2026-11-06  
**Status:** Accepted  
**Context:** Current stack uses MongoDB Atlas with Mongoose ODM. Phase 4 requires double-booking prevention with transactions.

**Options Considered:**
1. **Migrate to PostgreSQL + Prisma** — Relational, ACID transactions native, better for booking concurrency
2. **Stay with MongoDB + Mongoose** — Current investment, Mongoose supports transactions (requires replica set), flexible schema
3. **Hybrid** — MongoDB for documents, PostgreSQL for bookings — Adds operational complexity

**Selected Approach:** Option 2 — Stay with MongoDB + Mongoose.

**Reasoning:**
- Existing data models, Atlas cluster, and team knowledge preserved
- Mongoose transactions work with replica set (configured in docker-compose for local, Atlas supports natively)
- Double-booking prevention via **unique compound index with partial filter** on `(doctorId, slotStart)` where `cancelled: false`
- Data-access layer isolated (Repository/Service pattern) keeps PostgreSQL migration feasible later
- Portfolio can demonstrate "MongoDB transactions + replica set for concurrency control"

**Consequences:**
- Docker Compose MongoDB must run as single-node replica set (`rs.initiate()`)
- MongoDB Atlas: already a replica set — no extra config needed
- Mongoose models need `timestamps: true`, proper indexes, `runValidators: true` on updates
- Phase 4 concurrency test must run against replica set
- Document `decision.md` with PostgreSQL/Prisma as future migration path

**Related Decisions:** Phase 4 double-booking implementation, Repository pattern for data-access isolation

---

## Future Decision: PostgreSQL Migration Path (Deferred)

**Status:** Proposed (for future consideration)  
**Trigger:** If MongoDB transaction limitations become problematic, or portfolio needs SQL demonstration.

**Migration Strategy (when needed):**
1. Data-access layer already uses Repository pattern (interface + implementation)
2. Create `PrismaRepository` implementing same interface
3. Swap DI binding; zero controller/service changes
4. Run dual-write / CDC during cutover
5. Update `decision.md` with migration record

---

*End of Decision Log*
