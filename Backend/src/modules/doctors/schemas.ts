import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    speciality: z.string().min(1, 'Speciality is required'),
    degree: z.string().min(1, 'Degree is required'),
    experience: z.string().min(1, 'Experience is required'),
    about: z.string().min(1, 'About is required'),
    fees: z.number().positive('Fees must be positive'),
    address: z.object({
      line1: z.string().min(1, 'Address line 1 is required'),
      line2: z.string().optional(),
    }),
    slotDuration: z.number().positive().default(30),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    speciality: z.string().optional(),
    degree: z.string().optional(),
    experience: z.string().optional(),
    about: z.string().optional(),
    fees: z.number().positive().optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
      })
      .optional(),
    slotDuration: z.number().positive().optional(),
    available: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
});

export const setAvailabilitySchema = z.object({
  body: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    breakStart: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    breakEnd: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    isActive: z.boolean().default(true),
  }),
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
});

export const addLeaveSchema = z.object({
  body: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Doctor ID is required'),
  }),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body'];
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>['body'];
export type AddLeaveInput = z.infer<typeof addLeaveSchema>['body'];
