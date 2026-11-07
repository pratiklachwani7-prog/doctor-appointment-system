import mongoose from 'mongoose';
import type { IUser, UserDocument } from '../modules/auth/types.js';
import type { IDoctor, DoctorDocument } from '../modules/doctors/types.js';
import type { IAppointment, AppointmentDocument } from '../modules/appointments/types.js';
import type { IRefreshToken, RefreshTokenDocument } from '../modules/auth/types.js';

// User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: '' },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
    },
    gender: { type: String, default: 'Not Selected' },
    dob: { type: String, default: 'Not Selected' },
    phone: { type: String, default: '0000000000' },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'ADMIN'],
      default: 'PATIENT',
    },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });

// Doctor schema - matches IDoctor interface
const doctorSchema = new mongoose.Schema(
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
    isVerified: { type: Boolean, default: false },
    fees: { type: Number, required: true },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, required: true },
    },
    slotDuration: { type: Number, default: 30 },
    slots_booked: { type: Object, default: {} },
    date: { type: Date, required: true },
    availability: [
      {
        dayOfWeek: { type: Number, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        breakStart: { type: String },
        breakEnd: { type: String },
        isActive: { type: Boolean, required: true },
      },
    ],
    leave: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    minimize: false,
  }
);

doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ speciality: 1 });
doctorSchema.index({ available: 1, isVerified: 1 });
doctorSchema.index({ fees: 1 });

// Appointment schema - matches IAppointment interface
const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    cancellationReason: { type: String },
    cancelledBy: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
    consultationNotes: { type: String },
    userData: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: {
        line1: { type: String, required: true },
        line2: { type: String, required: true },
      },
    },
    docData: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      speciality: { type: String, required: true },
      degree: { type: String, required: true },
      fees: { type: Number, required: true },
      address: {
        line1: { type: String, required: true },
        line2: { type: String, required: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ slotStart: 1 });
appointmentSchema.index({ status: 1 });
// Compound unique index to prevent double booking (partial filter for active appointments)
appointmentSchema.index(
  { doctorId: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['CANCELLED', 'NO_SHOW'] } },
  }
);

// Refresh token schema
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  {
    timestamps: true,
  }
);

// Export models with proper generic types - cast to avoid schema/interface mismatch
export const UserModel = mongoose.model<UserDocument>('User', userSchema);
export const DoctorModel = mongoose.model<DoctorDocument>('Doctor', doctorSchema);
export const AppointmentModel = mongoose.model<AppointmentDocument>(
  'Appointment',
  appointmentSchema
);
export const RefreshTokenModel = mongoose.model<RefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema
);

// Export types for use in repositories
export type {
  IUser,
  UserDocument,
  IDoctor,
  DoctorDocument,
  IAppointment,
  AppointmentDocument,
  IRefreshToken,
  RefreshTokenDocument,
};
