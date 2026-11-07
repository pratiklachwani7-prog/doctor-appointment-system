import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number')
      .optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
      })
      .optional(),
    dob: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Not Selected']).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
