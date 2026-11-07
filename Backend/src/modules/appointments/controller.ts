import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './service.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentQuerySchema,
} from './schemas.js';

export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body;
      const appointment = await this.appointmentService.bookAppointment(userId, input);
      res
        .status(201)
        .json(ApiResponseBuilder.created(appointment, 'Appointment booked successfully'));
    } catch (error) {
      next(error);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = req.body;
      const appointment = await this.appointmentService.cancelAppointment(userId, input, userRole);
      res.json(ApiResponseBuilder.success(appointment, 'Appointment cancelled successfully'));
    } catch (error) {
      next(error);
    }
  };

  rescheduleAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body;
      const appointment = await this.appointmentService.rescheduleAppointment(userId, input);
      res.json(ApiResponseBuilder.success(appointment, 'Appointment rescheduled successfully'));
    } catch (error) {
      next(error);
    }
  };

  getMyAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as any;
      const result = await this.appointmentService.getAppointmentsByUser(userId, query);
      res.json(ApiResponseBuilder.success(result, 'Appointments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDoctorAppointments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = req.params as { doctorId?: string };
      const doctorId = params.doctorId || req.user!.id;
      const query = req.query as any;
      const result = await this.appointmentService.getAppointmentsByDoctor(doctorId, query);
      res.json(ApiResponseBuilder.success(result, 'Doctor appointments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getAllAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const result = await this.appointmentService.getAllAppointments(query);
      res.json(ApiResponseBuilder.success(result, 'All appointments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const appointment = await this.appointmentService.getAppointmentById(id);
      res.json(ApiResponseBuilder.success(appointment, 'Appointment retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateAppointmentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body;
      const userRole = req.user!.role;
      const appointment = await this.appointmentService.updateAppointmentStatus(
        id,
        status,
        userRole
      );
      res.json(ApiResponseBuilder.success(appointment, 'Appointment status updated successfully'));
    } catch (error) {
      next(error);
    }
  };
}
