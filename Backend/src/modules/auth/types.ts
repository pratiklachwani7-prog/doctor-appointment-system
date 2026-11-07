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

export interface IRefreshToken {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Mongoose document types
export type UserDocument = Document & IUser;
export type RefreshTokenDocument = Document & IRefreshToken;
