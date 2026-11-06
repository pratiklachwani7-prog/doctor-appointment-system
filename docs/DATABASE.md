# Database Design

**Project:** MediConnect  
**Version:** 1.0  
**Date:** 2026-11-06  
**Status:** Draft (from Phase 1 audit of actual Mongoose models + Phase 2 planned changes)

---

## 1. Database Technology

| Aspect | Choice |
|--------|--------|
| Database | MongoDB 7.x |
| ODM | Mongoose 9.9.4 |
| Hosting | MongoDB Atlas (production), Docker replica set (local) |
| Connection | Mongoose with connection pooling |

---

## 2. Current Collections (Pre-Phase 2) — From Audit

### users
```javascript
// Current (JavaScript)
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: "base64_placeholder" },
  address: { 
    type: Object, 
    default: { line1: "", line2: "" } 
  },
  gender: { type: String, default: "Not Selected" },
  dob: { type: String, default: "Not Selected" },
  phone: { type: String, default: "0000000000" }
}
```

**Issues:** No timestamps, no indexes beyond email unique, dob/gender as strings, phone default weak.

### doctors
```javascript
// Current (JavaScript)
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, required: true },
  speciality: { type: String, required: true },
  degree: { type: String, required: true },
  experience: { type: String, required: true },
  about: { type: String, required: true },
  available: { type: Boolean, default: true },
  fees: { type: Number, required: true },
  address: { type: Object, required: true },
  date: { type: Date, required: true },
  slots_booked: { type: Object, default: {} }  // Denormalized: { "2024-01-15": ["10:00", "10:30"] }
}
```

**Issues:** `slots_booked` denormalized (race conditions), `date` instead of `createdAt`, no `isVerified` for admin approval, no timestamps, experience/degree as strings.

### appointments
```javascript
// Current (JavaScript)
{
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },  // Timestamp
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false }
}
```

**Issues:** `userId`/`docId` as Strings not ObjectId refs, denormalized `userData`/`docData`, `date` as Number, multiple boolean status flags instead of single enum, no unique constraint on (docId, slotDate, slotTime).

---

## 3. Target Collections (Post-Phase 2) — TypeScript with Proper Indexes

### users
```typescript
interface IUser extends Document {
  name: string;
  email: string;
  password: string;  // hashed
  image: string;
  address: { line1: string; line2: string };
  gender: 'male' | 'female' | 'other' | 'not_selected';
  dob: Date | null;
  phone: string;
  role: 'patient';
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
```

### doctors
```typescript
interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;  // hashed
  image: string;
  speciality: string;
  degree: string;
  experienceYears: number;  // Changed from string
  about: string;
  available: boolean;
  isVerified: boolean;  // Admin verification
  fees: number;
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  slotDuration: number;  // minutes, default 30
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ speciality: 1 });
doctorSchema.index({ available: 1, isVerified: 1 });
doctorSchema.index({ fees: 1 });
doctorSchema.index({ createdAt: -1 });
```

### doctor_availability (NEW - Phase 4)
```typescript
interface IDoctorAvailability extends Document {
  doctorId: Types.ObjectId;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  startTime: string;  // "09:00"
  endTime: string;    // "17:00"
  breakStart: string | null;  // "13:00"
  breakEnd: string | null;    // "14:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });
```

### doctor_leave (NEW - Phase 4)
```typescript
interface IDoctorLeave extends Document {
  doctorId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: Date;
}

// Indexes
leaveSchema.index({ doctorId: 1, startDate: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
```

### appointments
```typescript
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

interface IAppointment extends Document {
  userId: Types.ObjectId;
  doctorId: Types.ObjectId;
  slotStart: Date;  // Combined date + time
  slotEnd: Date;
  amount: number;
  status: AppointmentStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentId: string | null;
  cancellationReason: string | null;
  cancelledBy: 'patient' | 'doctor' | 'admin' | null;
  cancelledAt: Date | null;
  completedAt: Date | null;
  consultationNotes: string | null;  // Doctor-only, visible to patient
  createdAt: Date;
  updatedAt: Date;
}

// Indexes - CRITICAL for double-booking prevention
appointmentSchema.index({ doctorId: 1, slotStart: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $nin: ['cancelled', 'no_show'] } } 
});
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ slotStart: 1 });
```

### waitlist (NEW - Phase 4)
```typescript
interface IWaitlist extends Document {
  doctorId: Types.ObjectId;
  slotStart: Date;
  userId: Types.ObjectId;
  position: number;
  notifiedAt: Date | null;
  expiresAt: Date;  // Auto-expire after notification window
  createdAt: Date;
}

// Indexes
waitlistSchema.index({ doctorId: 1, slotStart: 1, position: 1 });
waitlistSchema.index({ userId: 1 });
waitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // TTL
```

### notifications (NEW - Phase 3/6)
```typescript
type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'reminder_24h' | 'reminder_1h' | 'waitlist_offer' | 'payment_success' | 'doctor_verified';

interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;  // appointmentId, doctorId, etc.
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// Indexes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
```

### audit_logs (NEW - Phase 6)
```typescript
type AuditAction = 'user_register' | 'user_login' | 'user_update' | 'doctor_create' | 'doctor_update' | 'doctor_verify' | 'appointment_book' | 'appointment_cancel' | 'appointment_reschedule' | 'appointment_complete' | 'payment_create' | 'payment_verify' | 'admin_action';

interface IAuditLog extends Document {
  userId: Types.ObjectId | null;  // null for anonymous actions
  role: 'patient' | 'doctor' | 'admin' | 'anonymous';
  action: AuditAction;
  resource: string;  // 'appointment', 'doctor', 'user', etc.
  resourceId: Types.ObjectId | string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Indexes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
```

---

## 4. Relationships & Data Flow

```
User (Patient) 1───* Appointment *───1 Doctor
     │                                    │
     └────── Notification (1───*) ────────┘
     │
     └────── Waitlist (1───*) ────── Doctor/Slot
```

- **User → Appointment:** One-to-many (userId)
- **Doctor → Appointment:** One-to-many (doctorId)
- **Doctor → Availability:** One-to-many (doctorId, dayOfWeek unique)
- **Doctor → Leave:** One-to-many (doctorId)
- **Appointment → Waitlist:** One-to-many (doctorId + slotStart)
- **User/Doctor → Notification:** One-to-many (userId)
- **All → AuditLog:** Many-to-one (userId nullable)

---

## 5. Migration & Seed Strategy

### Migration Approach
- No formal migration tool (MongoDB is schemaless)
- Use Mongoose `runValidators: true` on updates
- New fields added with defaults
- Backfill scripts for existing data if needed

### Seed Script (Phase 2)
Synthetic data only — no real personal/medical data:
- 10 specialties (Cardiology, Dermatology, Neurology, etc.)
- 20 doctors across specialties, verified/unverified mix
- 50 patients with profiles
- 100 appointments across statuses (past/upcoming)
- 5 admin users

---

## 6. Transactions (Phase 4)

### Booking Transaction
```typescript
// Requires MongoDB replica set
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Lock doctor document (findOneAndUpdate with $inc for version)
  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { $inc: { __v: 1 } },
    { new: true, session }
  ).select('+slots_booked');
  
  // 2. Check slot available
  const slotKey = formatDate(slotStart);
  if (doctor.slots_booked[slotKey]?.includes(formatTime(slotStart))) {
    throw new ConflictError('Slot already booked');
  }
  
  // 3. Create appointment
  const appointment = await Appointment.create([{
    userId, doctorId, slotStart, slotEnd, amount, status: 'pending'
  }], { session });
  
  // 4. Update doctor slots_booked
  doctor.slots_booked[slotKey] = [...(doctor.slots_booked[slotKey] || []), formatTime(slotStart)];
  await doctor.save({ session });
  
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

---

## 7. Connection & Configuration

### Mongoose Options
```typescript
await mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority',
});
```

### Replica Set (Required for Transactions)
- **Local:** Single-node replica set via docker-compose init script
- **Production:** MongoDB Atlas (managed 3-node replica set)

---

*This document is derived from the actual Mongoose models found in Phase 1 audit and the planned Phase 2-4 schema changes.*
