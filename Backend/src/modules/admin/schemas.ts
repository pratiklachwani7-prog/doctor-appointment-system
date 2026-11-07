import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    image: z.string().url('Image must be a valid URL'),
    speciality: z.string().min(1, 'Speciality is required'),
    degree: z.string().min(1, 'Degree is required'),
    experience: z.string().min(1, 'Experience is required'),
    about: z.string().min(10, 'About must be at least 10 characters'),
    fees: z.coerce.number().positive('Fees must be a positive number'),
    address: z.object({
      line1: z.string().min(1, 'Address line 1 is required'),
      line2: z.string().optional(),
    }),
    slotDuration: z.coerce.number().positive().optional().default(30),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    image: z.string().url().optional(),
    speciality: z.string().optional(),
    degree: z.string().optional(),
    experience: z.string().optional(),
    about: z.string().min(10).optional(),
    fees: z.coerce.number().positive().optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
      })
      .optional(),
    slotDuration: z.coerce.number().positive().optional(),
    available: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  }),
});

export const toggleAvailabilitySchema = z.object({
  body: z.object({
    available: z.boolean(),
  }),
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
});

export const verifyDoctorSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
  }),
  params: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
  }),
});

export const adminQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['verified', 'unverified', 'available', 'unavailable']).optional(),
    sortBy: z.enum(['name', 'email', 'speciality', 'fees', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>['body'];
export type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>['body'];
export type VerifyDoctorInput = z.infer<typeof verifyDoctorSchema>['body'];
export type AdminQueryInput = z.infer<typeof adminQuerySchema>['query'];
