import { Document } from 'mongoose';

export interface IDoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
}

export interface IDoctorLeave {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface IDoctor {
  name: string;
  email: string;
  password: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  isVerified: boolean;
  fees: number;
  address: {
    line1: string;
    line2: string;
  };
  slotDuration: number;
  slots_booked: Record<string, string[]>;
  date: Date;
  availability: IDoctorAvailability[];
  leave: IDoctorLeave[];
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorDocument = Document & IDoctor;
