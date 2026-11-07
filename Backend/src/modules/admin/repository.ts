import { Model } from 'mongoose';
import { IUser, UserDocument } from '../auth/types.js';
import { IDoctor, DoctorDocument } from '../doctors/types.js';
import { IAppointment, AppointmentDocument } from '../appointments/types.js';

export class AdminRepository {
  constructor(
    private userModel: Model<UserDocument>,
    private doctorModel: Model<DoctorDocument>,
    private appointmentModel: Model<AppointmentDocument>
  ) {}

  // User methods
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
    role?: string
  ): Promise<{ users: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users, total };
  }

  // Doctor methods
  async findDoctorByEmail(email: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findOne({ email }).exec();
  }

  async findDoctorById(id: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findById(id).select('-password').exec();
  }

  async createDoctor(doctorData: any): Promise<DoctorDocument> {
    const doctor = new this.doctorModel(doctorData);
    return doctor.save();
  }

  async updateDoctor(id: string, data: any): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndUpdate(id, data, { new: true }).select('-password').exec();
  }

  async getDoctors(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ): Promise<{ doctors: DoctorDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { speciality: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      switch (status) {
        case 'verified':
          query.isVerified = true;
          break;
        case 'unverified':
          query.isVerified = false;
          break;
        case 'available':
          query.available = true;
          break;
        case 'unavailable':
          query.available = false;
          break;
      }
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [doctors, total] = await Promise.all([
      this.doctorModel.find(query).select('-password').sort(sort).skip(skip).limit(limit).exec(),
      this.doctorModel.countDocuments(query).exec(),
    ]);
    return { doctors, total };
  }

  async toggleDoctorAvailability(id: string, available: boolean): Promise<DoctorDocument | null> {
    return this.doctorModel
      .findByIdAndUpdate(id, { available }, { new: true })
      .select('-password')
      .exec();
  }

  async verifyDoctor(id: string, isVerified: boolean): Promise<DoctorDocument | null> {
    return this.doctorModel
      .findByIdAndUpdate(id, { isVerified }, { new: true })
      .select('-password')
      .exec();
  }

  async deleteDoctor(id: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndDelete(id).exec();
  }

  // Appointment methods for admin
  async getAllAppointments(
    page = 1,
    limit = 20,
    status?: string,
    sortBy = 'slotStart',
    sortOrder = 'asc'
  ): Promise<{ appointments: AppointmentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) {
      query.status = status;
    }
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [appointments, total] = await Promise.all([
      this.appointmentModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.appointmentModel.countDocuments(query).exec(),
    ]);
    return { appointments, total };
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      usersByRole,
      appointmentsByStatus,
      recentAppointments,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.doctorModel.countDocuments().exec(),
      this.appointmentModel.countDocuments().exec(),
      this.appointmentModel.countDocuments({ status: 'PENDING' }).exec(),
      this.appointmentModel.countDocuments({ status: 'COMPLETED' }).exec(),
      this.appointmentModel.countDocuments({ status: 'CANCELLED' }).exec(),
      this.userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).exec(),
      this.appointmentModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
      this.appointmentModel.find().sort({ createdAt: -1 }).limit(10).exec(),
      this.userModel.find().select('-password').sort({ createdAt: -1 }).limit(10).exec(),
    ]);

    const roleCounts = { PATIENT: 0, DOCTOR: 0, ADMIN: 0 };
    usersByRole.forEach((r: any) => {
      roleCounts[r._id as keyof typeof roleCounts] = r.count;
    });

    const statusCounts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 };
    appointmentsByStatus.forEach((s: any) => {
      statusCounts[s._id as keyof typeof statusCounts] = s.count;
    });

    // Calculate total revenue from completed appointments
    const revenueResult = await this.appointmentModel
      .aggregate([
        { $match: { status: 'COMPLETED', paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();

    return {
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue: revenueResult[0]?.total || 0,
      usersByRole: roleCounts,
      appointmentsByStatus: statusCounts,
      recentAppointments,
      recentUsers,
    };
  }
}
