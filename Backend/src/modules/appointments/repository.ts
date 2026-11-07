import { Model } from 'mongoose';
import { IAppointment, AppointmentDocument } from './types.js';

export class AppointmentRepository {
  constructor(private appointmentModel: Model<AppointmentDocument>) {}

  async findById(id: string): Promise<AppointmentDocument | null> {
    return this.appointmentModel.findById(id).exec();
  }

  async findByUserId(
    userId: string,
    page = 1,
    limit = 20,
    status?: string,
    sortBy = 'slotStart',
    sortOrder = 'asc'
  ): Promise<{ appointments: AppointmentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = { userId };
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

  async findByDoctorId(
    doctorId: string,
    page = 1,
    limit = 20,
    status?: string,
    sortBy = 'slotStart',
    sortOrder = 'asc'
  ): Promise<{ appointments: AppointmentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = { doctorId };
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

  async findAll(
    query: any = {},
    page = 1,
    limit = 20,
    sortBy = 'slotStart',
    sortOrder = 'asc'
  ): Promise<{ appointments: AppointmentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [appointments, total] = await Promise.all([
      this.appointmentModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.appointmentModel.countDocuments(query).exec(),
    ]);
    return { appointments, total };
  }

  async create(appointmentData: any): Promise<AppointmentDocument> {
    const appointment = new this.appointmentModel(appointmentData);
    return appointment.save();
  }

  async update(id: string, data: any): Promise<AppointmentDocument | null> {
    return this.appointmentModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findByDoctorAndSlot(
    doctorId: string,
    slotStart: Date
  ): Promise<AppointmentDocument | null> {
    return this.appointmentModel
      .findOne({
        doctorId,
        slotStart,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      })
      .exec();
  }

  async findOverlappingAppointments(
    doctorId: string,
    slotStart: Date,
    slotEnd: Date,
    excludeId?: string
  ): Promise<AppointmentDocument[]> {
    const query: any = {
      doctorId,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      $or: [{ slotStart: { $lt: slotEnd }, slotEnd: { $gt: slotStart } }],
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return this.appointmentModel.find(query).exec();
  }

  async countByStatus(doctorId: string, status: IAppointment['status']): Promise<number> {
    return this.appointmentModel.countDocuments({ doctorId, status }).exec();
  }
}
