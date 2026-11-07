import { DoctorRepository } from './repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/utils/errors.js';
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  SetAvailabilityInput,
  AddLeaveInput,
} from './schemas.js';
import { IDoctor } from './types.js';

export class DoctorService {
  constructor(private doctorRepository: DoctorRepository) {}

  async createDoctor(input: CreateDoctorInput): Promise<any> {
    const existingDoctor = await this.doctorRepository.findByEmail(input.email);
    if (existingDoctor) {
      throw new ConflictError('Doctor with this email already exists');
    }

    const doctor = await this.doctorRepository.create({
      ...input,
      role: 'DOCTOR',
      isVerified: false,
      available: true,
      slots_booked: {},
      date: new Date(),
      availability: [],
      leave: [],
    });

    const { password, ...doctorWithoutPassword } = doctor.toObject();
    return doctorWithoutPassword;
  }

  async getDoctorById(id: string): Promise<any> {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }
    return doctor;
  }

  async getDoctors(
    page = 1,
    limit = 20,
    specialty?: string,
    verifiedOnly = true
  ): Promise<{ doctors: any[]; total: number }> {
    return this.doctorRepository.findVerifiedDoctors(page, limit, undefined);
  }

  async updateDoctor(id: string, input: UpdateDoctorInput): Promise<any> {
    const doctor = await this.doctorRepository.update(id, input);
    if (!doctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = doctor.toObject();
    return doctorWithoutPassword;
  }

  async setAvailability(doctorId: string, input: SetAvailabilityInput): Promise<any> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }

    const availability = doctor.availability || [];
    const existingIndex = availability.findIndex(a => a.dayOfWeek === input.dayOfWeek);

    const newAvailability = {
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      breakStart: input.breakStart,
      breakEnd: input.breakEnd,
      isActive: input.isActive,
    };

    if (existingIndex >= 0) {
      availability[existingIndex] = newAvailability;
    } else {
      availability.push(newAvailability);
    }

    const updatedDoctor = await this.doctorRepository.updateAvailability(doctorId, availability);
    if (!updatedDoctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = updatedDoctor.toObject();
    return doctorWithoutPassword;
  }

  async addLeave(doctorId: string, input: AddLeaveInput): Promise<any> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }

    const leave = {
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      reason: input.reason,
    };

    const updatedDoctor = await this.doctorRepository.addLeave(doctorId, leave);
    if (!updatedDoctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = updatedDoctor.toObject();
    return doctorWithoutPassword;
  }

  async removeLeave(doctorId: string, leaveId: string): Promise<any> {
    const updatedDoctor = await this.doctorRepository.removeLeave(doctorId, leaveId);
    if (!updatedDoctor) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = updatedDoctor.toObject();
    return doctorWithoutPassword;
  }

  async getDoctorsBySpecialty(specialty: string): Promise<any[]> {
    return this.doctorRepository.findBySpecialty(specialty);
  }

  async getAllDoctors(
    page = 1,
    limit = 20,
    specialty?: string
  ): Promise<{ doctors: any[]; total: number }> {
    return this.doctorRepository.findAll({ isVerified: true, available: true }, page, limit);
  }
}
