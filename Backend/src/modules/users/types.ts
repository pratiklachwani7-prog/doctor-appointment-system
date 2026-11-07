import { Document } from 'mongoose';

export interface IUser {
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
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isVerified: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// For partial updates (e.g., profile update)
export interface IUserUpdate {
  name?: string;
  email?: string;
  image?: string;
  address?: {
    line1?: string;
    line2?: string;
  };
  gender?: string;
  dob?: string;
  phone?: string;
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isVerified?: boolean;
  password?: string;
}

export type UserDocument = Document & IUser;
