import { Document } from 'mongoose';

export interface IAppointment {
  userId: string;
  doctorId: string;
  slotDate: string;
  slotTime: string;
  slotStart: Date;
  slotEnd: Date;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentId?: string;
  cancellationReason?: string;
  cancelledBy?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  cancelledAt?: Date;
  completedAt?: Date;
  consultationNotes?: string;
  userData: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
    };
  };
  docData: {
    name: string;
    email: string;
    speciality: string;
    degree: string;
    fees: number;
    address: {
      line1: string;
      line2: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentDocument = Document & IAppointment;
