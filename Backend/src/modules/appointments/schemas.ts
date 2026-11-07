import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    slotStart: z.string().datetime('Invalid slot start time'),
  }),
});

export const cancelAppointmentSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    cancellationReason: z.string().optional(),
  }),
});

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    newSlotStart: z.string().datetime('Invalid new slot start time'),
  }),
});

export const appointmentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(20),
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    sortBy: z.enum(['slotStart', 'createdAt', 'updatedAt']).default('slotStart'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>['body'];
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>['body'];
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>['body'];
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>['query'];
