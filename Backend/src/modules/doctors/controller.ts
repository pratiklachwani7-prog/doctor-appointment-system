import { Request, Response, NextFunction } from 'express';
import { DoctorService } from './service.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  setAvailabilitySchema,
  addLeaveSchema,
} from './schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireDoctor, requireAdmin } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';

export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const specialty = req.query.specialty as string | undefined;

      const result = await this.doctorService.getDoctors(page, limit, specialty);
      res.json(ApiResponseBuilder.success(result, 'Doctors retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as { id: string };
      const doctor = await this.doctorService.getDoctorById(params.id);
      res.json(ApiResponseBuilder.success(doctor, 'Doctor retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  createDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const doctor = await this.doctorService.createDoctor(input);
      res.status(201).json(ApiResponseBuilder.created(doctor, 'Doctor created successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as { id: string };
      const input = req.body;
      const doctor = await this.doctorService.updateDoctor(params.id, input);
      res.json(ApiResponseBuilder.success(doctor, 'Doctor updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  setAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as { id: string };
      const input = req.body;
      const doctor = await this.doctorService.setAvailability(params.id, input);
      res.json(ApiResponseBuilder.success(doctor, 'Availability updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  addLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = req.params as { id: string };
      const input = req.body;
      const doctor = await this.doctorService.addLeave(params.id, input);
      res.json(ApiResponseBuilder.success(doctor, 'Leave added successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDoctorsBySpecialty = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = req.params as { specialty: string };
      const doctors = await this.doctorService.getDoctorsBySpecialty(params.specialty);
      res.json(ApiResponseBuilder.success(doctors, 'Doctors retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}
