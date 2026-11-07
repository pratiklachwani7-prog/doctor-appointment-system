import { Model } from 'mongoose';
import { IDoctor, DoctorDocument } from './types.js';

export class DoctorRepository {
  constructor(private doctorModel: Model<DoctorDocument>) {}

  async findById(id: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findById(id).select('-password').exec();
  }

  async findByEmail(email: string): Promise<DoctorDocument | null> {
    return this.doctorModel.findOne({ email }).exec();
  }

  async findAll(
    query: any = {},
    page = 1,
    limit = 20
  ): Promise<{ doctors: DoctorDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [doctors, total] = await Promise.all([
      this.doctorModel.find(query).select('-password').skip(skip).limit(limit).exec(),
      this.doctorModel.countDocuments(query).exec(),
    ]);
    return { doctors, total };
  }

  async findVerifiedDoctors(
    page = 1,
    limit = 20,
    specialty?: string
  ): Promise<{ doctors: DoctorDocument[]; total: number }> {
    const query: any = { isVerified: true, available: true };
    if (specialty) {
      query.speciality = specialty;
    }
    return this.findAll(query, page, limit);
  }

  async create(doctorData: any): Promise<DoctorDocument> {
    const doctor = new this.doctorModel(doctorData);
    return doctor.save();
  }

  async update(id: string, data: any): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndUpdate(id, data, { new: true }).select('-password').exec();
  }

  async updateAvailability(id: string, availability: any[]): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndUpdate(id, { availability }, { new: true }).exec();
  }

  async addLeave(
    id: string,
    leave: { startDate: Date; endDate: Date; reason?: string }
  ): Promise<DoctorDocument | null> {
    return this.doctorModel.findByIdAndUpdate(id, { $push: { leave } }, { new: true }).exec();
  }

  async removeLeave(id: string, leaveId: string): Promise<DoctorDocument | null> {
    return this.doctorModel
      .findByIdAndUpdate(id, { $pull: { leave: { _id: leaveId } } }, { new: true })
      .exec();
  }

  async findBySpecialty(specialty: string): Promise<DoctorDocument[]> {
    return this.doctorModel
      .find({ speciality: specialty, isVerified: true, available: true })
      .select('-password')
      .exec();
  }
}
