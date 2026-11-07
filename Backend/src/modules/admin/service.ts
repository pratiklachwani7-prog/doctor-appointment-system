import { AdminRepository } from './repository.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
} from '../../shared/utils/errors.js';
import {
  AdminLoginInput,
  CreateDoctorInput,
  UpdateDoctorInput,
  ToggleAvailabilityInput,
  VerifyDoctorInput,
  AdminQueryInput,
} from './schemas.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '../../shared/utils/index.js';
import { UserModel, DoctorModel, AppointmentModel } from '../../models/index.js';

export class AdminService {
  constructor(private adminRepository: AdminRepository) {}

  async adminLogin(input: AdminLoginInput): Promise<any> {
    const { email, password } = input;

    // Check against admin credentials from config
    const { config } = await import('../../config/index.js');

    if (email !== config.admin.email) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await comparePassword(password, config.admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Create a mock admin user object for token generation
    const adminUser = {
      id: 'admin',
      email: config.admin.email,
      role: 'ADMIN',
    };

    const accessToken = generateAccessToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    return {
      accessToken,
      refreshToken,
      admin: {
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  }

  async createDoctor(input: CreateDoctorInput): Promise<any> {
    const existingDoctor = await this.adminRepository.findDoctorByEmail(input.email);
    if (existingDoctor) {
      throw new ConflictError('Doctor with this email already exists');
    }

    const hashedPassword = await hashPassword(input.password);

    const doctor = await this.adminRepository.createDoctor({
      ...input,
      password: hashedPassword,
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

  async getDoctors(query: AdminQueryInput): Promise<any> {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    return this.adminRepository.getDoctors(page, limit, search, status, sortBy, sortOrder);
  }

  async getDoctorById(id: string): Promise<any> {
    const doctor = await this.adminRepository.findDoctorById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    return doctor;
  }

  async updateDoctor(id: string, input: UpdateDoctorInput): Promise<any> {
    // If email is being updated, check for conflicts
    if (input.email) {
      const existingDoctor = await this.adminRepository.findDoctorByEmail(input.email);
      if (existingDoctor && existingDoctor._id.toString() !== id) {
        throw new ConflictError('Doctor with this email already exists');
      }
    }

    const doctor = await this.adminRepository.updateDoctor(id, input);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const { password, ...doctorWithoutPassword } = doctor.toObject();
    return doctorWithoutPassword;
  }

  async toggleDoctorAvailability(id: string, input: ToggleAvailabilityInput): Promise<any> {
    const doctor = await this.adminRepository.toggleDoctorAvailability(id, input.available);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = doctor.toObject();
    return doctorWithoutPassword;
  }

  async verifyDoctor(id: string, input: VerifyDoctorInput): Promise<any> {
    const doctor = await this.adminRepository.verifyDoctor(id, input.isVerified);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    const { password, ...doctorWithoutPassword } = doctor.toObject();
    return doctorWithoutPassword;
  }

  async deleteDoctor(id: string): Promise<any> {
    const doctor = await this.adminRepository.deleteDoctor(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    return { message: 'Doctor deleted successfully' };
  }

  async getUsers(query: AdminQueryInput): Promise<any> {
    const { page, limit, search, status } = query;
    // The status field in AdminQueryInput is for doctor status (verified/unverified/available/unavailable)
    // For users, we need to filter by role. Let's check if there's a role filter in the query.
    // For now, we'll ignore the status filter for users or use a different approach
    return this.adminRepository.getUsers(page, limit, search, undefined);
  }

  async getAllAppointments(query: AdminQueryInput): Promise<any> {
    const { page, limit, status, sortBy, sortOrder } = query;
    return this.adminRepository.getAllAppointments(page, limit, status, sortBy, sortOrder);
  }

  async getDashboardStats(): Promise<any> {
    return this.adminRepository.getDashboardStats();
  }
}
