import { Document } from 'mongoose';

// Admin uses the User model with role ADMIN
export interface IAdmin {
  name: string;
  email: string;
  password: string;
  image: string;
  address: {
    line1: string;
    line2: string;
  };
  gender: string;
  dob: string;
  phone: string;
  role: 'ADMIN';
  isVerified: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminDocument = Document & IAdmin;

// Dashboard stats type
export interface IDashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  usersByRole: {
    PATIENT: number;
    DOCTOR: number;
    ADMIN: number;
  };
  appointmentsByStatus: {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
  recentAppointments: any[];
  recentUsers: any[];
}
