# System Flows (As-Is and To-Be)

**Project:** MediConnect (Doctor's Appointment System)
**Version:** 1.0
**Date:** 2026-11-06
**Status:** Draft — "As-Is" flows verified against actual controllers/middlewares; "To-Be" flows reflect Phase 3–4 targets.

---

## 0. Conventions & Legacy Notes

- Current base paths: `/api/user`, `/api/doctor`, `/api/admin` (no versioning). Target: `/api/v1/...`.
- Current response envelope is ad-hoc: `{ success, message, ... }` with inconsistent types (`success` sometimes string `"false"`), plus `error: err.message` leaks. Target: `{ success, data | error: { code, message, details? } }`.
- Cookies: registration sets `userToken`; login sets `loginToken`; `authUser` reads only `loginToken`. **A newly registered user is not authenticated until they log in** (as-is bug).
- Admin auth: token payload is the string `ADMIN_EMAIL + ADMIN_PASSWORD`; `authadmin` compares the decoded payload to the same concatenation. Credentials are effectively in the token and comparison is non-cryptographic (as-is; Critical C3 in `docs/SECURITY.md`).
- All controllers wrap logic in `try/catch` with `console.log(err)` and return `error: err.message` (as-is; leaks internals).
- Tokens are signed without `expiresIn` — they never expire (as-is; High H2).

---

## 1. Patient Registration

**Endpoint:** `POST /api/user/register`
**Auth:** None
**Body:** `{ name, email, password }`

### As-Is Flow
1. Validate presence of `name`, `email`, `password` → 400 if missing.
2. Validate email format with `validator.isEmail` → 400.
3. Validate password strength with `validator.isStrongPassword` → 400.
4. bcrypt salt (10 rounds) + hash.
5. `userModel.create({ name, email, password: hash })`.
6. Sign JWT `{ id }` with `JWT_SECRET` (no expiry).
7. Set cookie `userToken` (httpOnly only — no secure/sameSite).
8. Respond 201 with the **full user document (including password hash)** and the raw token in the body.

### Known Issues
- Password hash returned in response body (Critical — never return).
- Cookie name mismatch with `authUser` (see §0).
- Duplicate email handling depends on model unique index — verify it exists (TBD).
- No rate limiting.

### To-Be (Phase 2/3)
1. Zod schema validates body; unknown fields stripped.
2. Service checks email uniqueness explicitly → 409 on duplicate.
3. bcrypt cost 12; password excluded from all responses at serializer layer.
4. Access token (15 min) + refresh token (7 d, rotated) in HttpOnly/Secure/SameSite cookies.
5. 201 with `{ success: true, data: { id, name, email } }` — no token in body.
6. Rate limited (10/min/IP).

---

## 2. Patient Login

**Endpoint:** `POST /api/user/login`
**Auth:** None
**Body:** `{ email, password }`

### As-Is Flow
1. Find user by email; if absent → 401 "User Doesn't Exist" (discloses user existence).
2. bcrypt.compare; mismatch → 401 "Invalid Credentials".
3. Sign JWT `{ id }` (no expiry).
4. Set cookie `loginToken` (httpOnly only).
5. Respond 200 with **the token as the `message` field**.

### Known Issues
- User-existence disclosure (different messages for unknown email vs wrong password).
- Token returned in response body and placed in `message`.
- No expiry; no refresh mechanism.

### To-Be (Phase 3)
1. Generic 401 for both failure cases ("Invalid credentials").
2. Access + refresh token pair; cookies with full flags.
3. Response contains user summary only.
4. Failed attempts counted for rate limiting/lockout policy (TBD).

---

## 3. Profile Read & Update

**Endpoints:** `GET /api/user/get-profile`, `POST /api/user/update-profile`
**Auth:** `authUser` (JWT from `loginToken` cookie) → sets `req.userId`

### As-Is Flow (GET)
1. `authUser` verifies token; 401 on missing/invalid.
2. `userModel.findById(req.userId).select('-password')`; 404 if absent.
3. 200 with user document (password excluded).

### As-Is Flow (POST, multipart)
1. `multer` parses single `image` file (memory/disk per middleware config).
2. `authUser` verifies token.
3. Require `name`, `phone`, `dob`, `gender` → 400 if missing. `address` parsed via `JSON.parse(address)` (throws → caught as 500).
4. If image present: upload to Cloudinary; `findByIdAndUpdate` with image URL.
5. Second `findByIdAndUpdate` with profile fields (two non-atomic updates).
6. 200 with updated user (**password not excluded here** — leaks hash).

### Known Issues
- Two separate updates (non-atomic); image-only update path overwritten by second update? (verify — as-is second update excludes image key so it persists, but two round-trips).
- Password hash included in response.
- `JSON.parse` of client-supplied address is unvalidated (malformed → 500).

### To-Be (Phase 2)
1. Zod schema for multipart body; address as structured object, not string.
2. Single atomic update; password excluded via serializer.
3. Cloudinary adapter mocked in tests; size/MIME limits enforced.

---

## 4. Public Doctor Listing

**Endpoint:** `GET /api/doctor/list`
**Auth:** None

### As-Is Flow
1. `doctorModel.find({}).select(['-password','-email'])` — returns all doctors, all fields except password/email.
2. 200 with count message + doctors array.

### Known Issues
- No pagination/filtering/sorting.
- Unverified doctors not distinguished (no verification concept yet).
- `select(['-password','-email'])` — array form works, but double-check projection semantics (TBD).

### To-Be (Phase 2/3)
1. Pagination (`page`, `limit`), filtering (`speciality`, `available`), sorting (`fees`, `experience`).
2. Verified doctors only by default; `?includeUnverified=true` admin-only.
3. Public serializer: id, name, image, speciality, degree, experience, fees, available.

---

## 5. Admin Login

**Endpoint:** `POST /api/admin/login`
**Auth:** None
**Body:** `{ email, password }`

### As-Is Flow
1. Compare `email === ADMIN_EMAIL && password === ADMIN_PASSWORD` (plaintext env comparison).
2. Sign JWT with payload = `email + password` string, no expiry.
3. Set cookie `token` (httpOnly only).
4. Respond 200 with token in body.

### Known Issues
- Plaintext credential comparison in code (no hash).
- Credentials embedded in token payload; `authadmin` compares decoded payload to concatenation — not a role/identity check.
- No expiry, no rotation.

### To-Be (Phase 3)
1. Admin user stored in DB with hashed password; login via bcrypt compare.
2. JWT payload `{ id, role: 'ADMIN' }`; RBAC middleware checks role claim only.
3. Cookie flags enforced; token never in body.
4. Rate limited; audit-logged.

---

## 6. Add Doctor (Admin)

**Endpoint:** `POST /api/admin/add-doctor`
**Auth:** `authAdmin`; multipart with `image`

### As-Is Flow
1. `authAdmin` verifies token (credential-concatenation check).
2. Require all fields (`name,email,password,speciality,degree,experience,about,fees,address`) → 400.
3. Validate email format + password strength.
4. bcrypt hash (10 rounds).
5. Upload image to Cloudinary (required — crashes if file missing; caught → 500 "LOL").
6. Save doctor document with `address: JSON.parse(address)` and `date: Date.now()`.
7. 201, message only.

### Known Issues
- Error message "LOL" on failure (Medium — unprofessional, leaks internal error text).
- Image upload failure or missing file → 500 instead of 400.
- No duplicate-email check documented (unique index TBD).
- No `isVerified` field yet.

### To-Be (Phase 2/3)
1. Zod schema; duplicate email → 409.
2. Image optional or validated with clear 400 on missing/invalid.
3. New doctors created unverified (`isVerified: false`); admin verification endpoint in Phase 3.
4. Proper error messages via centralized handler.

---

## 7. Change Doctor Availability (Admin)

**Endpoint:** `POST /api/admin/change-availability`
**Auth:** `authAdmin`
**Body:** `{ docId }`

### As-Is Flow
1. Find doctor; 404 if absent.
2. Toggle `available` boolean; return updated document.
3. **Bug:** `res.status().json(...)` — `status()` called without a code. Express throws/sets undefined; response may be malformed or hang.

### To-Be (Phase 2)
1. `res.status(200).json(...)` with standard envelope.
2. Zod validates `docId` as ObjectId string.
3. Audit log entry for availability changes.

---

## 8. Book Appointment

**Endpoint:** `POST /api/user/book-appointment`
**Auth:** `authUser`
**Body:** `{ docId, slotDate, slotTime }`

### As-Is Flow
1. Validate presence of `userId`, `slotDate`, `slotTime` (note: checks `slotDate`/`slotTime`, not `docId`; `success:"false"` string bug).
2. Fetch doctor (password excluded); 404 if absent; 409 if `!available`.
3. Read `doctor.slots_booked` (denormalized map `{ [date]: [times] }`).
4. If date key exists and time already listed → 409 "Slot is not Empty"; else push time.
5. If date key absent → create array and **push `slotDate` instead of `slotTime`** (bug — corrupts slot data).
6. Fetch user (password excluded); delete `docData.slots_booked` from snapshot.
7. Create appointment document embedding `userData` + `docData` snapshots, `amount = doctor.fees`, `date: Date.now()`.
8. `doctorModel.findByIdAndUpdate(docId, { slotsBooked })` — **field name mismatch**: schema field is `slots_booked`; update targets `slotsBooked` (likely ignored under Mongoose strict mode → slot never persists → double-booking possible).
9. 201 with full appointment document.

### Known Issues
- Slot corruption bug in step 5; field-name mismatch in step 8; no transaction — check-then-write race allows double-booking under concurrency.
- No validation that `slotDate` is today/future; no cutoff-window rule; no patient-overlap check.
- `success:"false"` string instead of boolean.

### To-Be (Phase 4)
1. Zod validation (ObjectId, ISO date, time format).
2. Business rules: not in past, within cutoff window, patient has no overlapping appointment, doctor on leave/break.
3. Transaction: re-check slot inside transaction, create appointment, mark slot — unique compound index `(doctorId, slotStart, cancelled:false)` as backstop.
4. Concurrency: 100 parallel requests → exactly 1 success, rest 409.
5. Slot model separate from doctor document (no denormalized map).

---

## 9. List My Appointments

**Endpoint:** `GET /api/user/appointments`
**Auth:** `authUser`

### As-Is Flow
1. `appointmentModel.find({ userId })` — all appointments, no pagination.
2. 200 with count + array (embeds user and doctor snapshots).

### To-Be (Phase 2/4)
1. Pagination + status filter (`upcoming`, `past`, `cancelled`).
2. Sort by `slotStart` ascending for upcoming.
3. Response uses standard envelope; snapshot fields trimmed to display needs.

---

## 10. Cancel Appointment

**Endpoint:** `POST /api/user/cancel-appointment`
**Auth:** `authUser`
**Body:** `{ appointmentId }`

### As-Is Flow
1. Fetch appointment; compare `appointment.userId != userId` → 403 with **empty message**.
2. Set `cancelled: true`.
3. Read doctor's `slots_booked`; filter out the time; update with `{ slotsBooked }` — **same field-name mismatch bug as §8** (slot may never be freed).
4. 200 "Appointment Cancelled".

### Known Issues
- Empty 403 message; field-name mismatch; no transaction; no waitlist notification; no refund handling; no cancellation-cutoff rule.

### To-Be (Phase 4)
1. Ownership check via RBAC + explicit 403 message.
2. Transaction: mark cancelled + free slot atomically.
3. Waitlist: notify first waitlisted patient for that slot.
4. Refund path for paid appointments (Razorpay refund API) — TBD policy.

---

## 11. Payment — Create Order

**Endpoint:** `POST /api/user/payment-razorpay`
**Auth:** `authUser`
**Body:** `{ appointmentId }`

### As-Is Flow
1. Fetch appointment; 400 if absent or cancelled.
2. `razorpay.orders.create({ amount: appointment.amount * 100, currency: CURRENCY, receipt: appointmentId })`.
3. 201 with order object.

### Known Issues
- `RAZORPAY_KEY_SECRET` empty in committed `.env` (Medium M3) — order creation fails until configured.
- No idempotency: repeated calls create duplicate orders.
- Currency from env; no validation.

### To-Be (Phase 4/5)
1. Idempotency key per appointment; reuse open order.
2. Currency fixed and validated.
3. Secret loaded from validated config module.

---

## 12. Payment — Verify

**Endpoint:** `POST /api/user/verify-razorpay`
**Auth:** `authUser`
**Body:** `{ razorpay_order_id }`

### As-Is Flow
1. Fetch order from Razorpay; if `status === 'paid'` → mark appointment `payment: true`.
2. **Bugs:** `res.status().json(...)` — no status code; no response at all when status is not `paid` (request hangs); no signature verification (`razorpay_order_id` trusted from client; should verify HMAC signature with `RAZORPAY_KEY_SECRET`).
3. Catch → 500 with internal message.

### Known Issues
- Missing response on unpaid orders (hanging request).
- No webhook signature verification — critical payment-security gap.
- No idempotent handling of repeated verification.

### To-Be (Phase 4/5)
1. Verify payment signature server-side (`razorpay_signature` + HMAC SHA256).
2. Always respond: paid → 200; unpaid/pending → 202 or 400 with code.
3. Webhook endpoint for asynchronous payment events; idempotent by order ID.
4. Audit log for payment state changes.

---

## 13. Route → Middleware → Controller Map (As-Is)

| Method | Path | Middleware chain | Controller |
|--------|------|------------------|------------|
| POST | /api/user/register | — | registerUser |
| POST | /api/user/login | — | loginUser |
| GET | /api/user/get-profile | authUser | getProfile |
| POST | /api/user/update-profile | multer, authUser | updateProfile |
| POST | /api/user/book-appointment | authUser | bookAppointment |
| GET | /api/user/appointments | authUser | listAppointments |
| POST | /api/user/cancel-appointment | authUser | cancelAppointment |
| POST | /api/user/payment-razorpay | authUser | paymentRazerPay |
| POST | /api/user/verify-razorpay | authUser | verifyRazorpay |
| GET | /api/doctor/list | — | doctorList |
| POST | /api/admin/login | — | loginAdmin |
| POST | /api/admin/add-doctor | authAdmin, multer | addDoctor |
| GET | /api/admin/all-doctors | authAdmin | allDoctors |
| POST | /api/admin/change-availability | authAdmin | changeAvailability |
| GET | / | — | inline "API is Working Like butter" |

---

## 14. Bug Summary Extracted From Flow Analysis

These are in addition to `docs/AUDIT.md` §5 and will be tracked in `docs/BUG.md`:

| # | Bug | Location | Severity |
|---|-----|----------|----------|
| B1 | Slot corruption: pushes `slotDate` instead of `slotTime` for new dates | `bookAppointment` | High |
| B2 | Field-name mismatch: updates `slotsBooked` but schema field is `slots_booked` | `bookAppointment`, `cancelAppointment` | High |
| B3 | `res.status()` called without code | `changeAvailability`, `verifyRazorpay` | High |
| B4 | Missing response when payment not paid (hanging request) | `verifyRazorpay` | High |
| B5 | Password hash returned in register/update responses | `registerUser`, `updateProfile` | Critical |
| B6 | Cookie name mismatch `userToken` vs `loginToken` | `registerUser` vs `authUser` | Medium |
| B7 | Empty 403 message on cancel ownership failure | `cancelAppointment` | Low |
| B8 | "LOL" error messages | `addDoctor`, `loginAdmin`, `authUser`, `authadmin` | Medium |
| B9 | `success:"false"` string instead of boolean | `bookAppointment` | Low |
| B10 | Admin token payload embeds credentials | `loginAdmin` + `authadmin` | Critical |

---

*As-is flows verified against `Backend/controller/*.js`, `Backend/middlewares/*.js`, and `Backend/routes/*.js` on 2026-11-06. To-be flows reflect the Phase 2–4 plan in `docs/PHASE_PLAN.md`.*
