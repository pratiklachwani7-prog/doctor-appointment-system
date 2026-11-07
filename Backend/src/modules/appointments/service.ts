import { AppointmentRepository } from './repository.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../shared/utils/errors.js';
import {
  BookAppointmentInput,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
  AppointmentQueryInput,
} from './schemas.js';
import { DoctorRepository } from '../doctors/repository.js';
import { UserRepository } from '../users/repository.js';
import { AppointmentModel } from '../../models/index.js';
import mongoose from 'mongoose';

export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private doctorRepository: DoctorRepository,
    private userRepository: UserRepository
  ) {}

  async bookAppointment(userId: string, input: BookAppointmentInput): Promise<any> {
    const { doctorId, slotStart } = input;

    // Check if doctor exists and is verified/available
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    if (!doctor.isVerified || !doctor.available) {
      throw new ForbiddenError('Doctor is not available for appointments');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Parse slotStart and calculate slotEnd based on doctor's slotDuration
    const start = new Date(slotStart);
    const slotDuration = doctor.slotDuration || 30; // minutes
    const end = new Date(start.getTime() + slotDuration * 60 * 1000);

    // Check for overlapping appointments (double-booking prevention)
    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      doctorId,
      start,
      end
    );
    if (overlapping.length > 0) {
      throw new ConflictError('This time slot is already booked');
    }

    // Create appointment data
    const appointmentData = {
      userId,
      doctorId,
      slotDate: start.toISOString().split('T')[0],
      slotTime: start.toTimeString().slice(0, 5),
      slotStart: start,
      slotEnd: end,
      amount: doctor.fees,
      status: 'PENDING' as const,
      paymentStatus: 'PENDING' as const,
      userData: {
        name: user.name,
        email: user.email,
        phone: user.phone || 'Not provided',
        address: user.address || { line1: '', line2: '' },
      },
      docData: {
        name: doctor.name,
        email: doctor.email,
        speciality: doctor.speciality,
        degree: doctor.degree,
        fees: doctor.fees,
        address: doctor.address || { line1: '', line2: '' },
      },
    };

    // Use transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = new AppointmentModel(appointmentData);
      await appointment.save({ session });

      await session.commitTransaction();
      return appointment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async cancelAppointment(
    userId: string,
    input: CancelAppointmentInput,
    userRole: string
  ): Promise<any> {
    const { appointmentId, cancellationReason } = input;

    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Check authorization - user can only cancel their own appointments, admins/doctors can cancel any
    const isOwner = appointment.userId.toString() === userId;
    const isAdmin = userRole === 'ADMIN';
    const isDoctor = userRole === 'DOCTOR' && appointment.doctorId.toString() === userId;

    if (!isOwner && !isAdmin && !isDoctor) {
      throw new ForbiddenError('Not authorized to cancel this appointment');
    }

    // Check if appointment can be cancelled
    if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(appointment.status)) {
      throw new ValidationError(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    // Check cutoff window (e.g., cannot cancel within 2 hours of appointment)
    const now = new Date();
    const hoursUntilAppointment =
      (appointment.slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilAppointment < 2 && !isAdmin) {
      throw new ValidationError('Cannot cancel within 2 hours of appointment');
    }

    const cancelledBy = isAdmin ? 'ADMIN' : isDoctor ? 'DOCTOR' : 'PATIENT';

    // Update appointment
    const updated = await this.appointmentRepository.update(appointmentId, {
      status: 'CANCELLED',
      cancellationReason,
      cancelledBy,
      cancelledAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundError('Appointment not found');
    }

    return updated;
  }

  async rescheduleAppointment(userId: string, input: RescheduleAppointmentInput): Promise<any> {
    const { appointmentId, newSlotStart } = input;

    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Check authorization - user can only reschedule their own appointments
    if (appointment.userId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to reschedule this appointment');
    }

    // Check if appointment can be rescheduled
    if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(appointment.status)) {
      throw new ValidationError(`Cannot reschedule appointment with status: ${appointment.status}`);
    }

    // Check cutoff window
    const now = new Date();
    const hoursUntilAppointment =
      (appointment.slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilAppointment < 2) {
      throw new ValidationError('Cannot reschedule within 2 hours of appointment');
    }

    // Get doctor for slot duration
    const doctor = await this.doctorRepository.findById(appointment.doctorId.toString());
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const start = new Date(newSlotStart);
    const slotDuration = doctor.slotDuration || 30;
    const end = new Date(start.getTime() + slotDuration * 60 * 1000);

    // Check for overlapping appointments (excluding current appointment)
    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      appointment.doctorId.toString(),
      start,
      end,
      appointmentId
    );
    if (overlapping.length > 0) {
      throw new ConflictError('This time slot is already booked');
    }

    // Update appointment
    const updated = await this.appointmentRepository.update(appointmentId, {
      slotDate: start.toISOString().split('T')[0],
      slotTime: start.toTimeString().slice(0, 5),
      slotStart: start,
      slotEnd: end,
    });

    if (!updated) {
      throw new NotFoundError('Appointment not found');
    }

    return updated;
  }

  async getAppointmentsByUser(userId: string, query: AppointmentQueryInput): Promise<any> {
    const { page, limit, status, sortBy, sortOrder } = query;
    return this.appointmentRepository.findByUserId(userId, page, limit, status, sortBy, sortOrder);
  }

  async getAppointmentsByDoctor(doctorId: string, query: AppointmentQueryInput): Promise<any> {
    const { page, limit, status, sortBy, sortOrder } = query;
    return this.appointmentRepository.findByDoctorId(
      doctorId,
      page,
      limit,
      status,
      sortBy,
      sortOrder
    );
  }

  async getAllAppointments(query: AppointmentQueryInput): Promise<any> {
    const { page, limit, status, sortBy, sortOrder } = query;
    const filter: any = {};
    if (status) filter.status = status;
    return this.appointmentRepository.findAll(filter, page, limit, sortBy, sortOrder);
  }

  async getAppointmentById(id: string): Promise<any> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }
    return appointment;
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: string,
    userRole: string
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    if (!validTransitions[appointment.status]?.includes(status)) {
      throw new ValidationError(
        `Invalid status transition from ${appointment.status} to ${status}`
      );
    }

    // Only admin/doctor can confirm/complete appointments
    if (['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(status) && userRole === 'PATIENT') {
      throw new ForbiddenError('Not authorized to perform this action');
    }

    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await this.appointmentRepository.update(appointmentId, updateData);
    return updated;
  }
}
