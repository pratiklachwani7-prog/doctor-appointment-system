import { Request, Response, NextFunction } from 'express';
import { AdminService } from './service.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';
import {
  adminLoginSchema,
  createDoctorSchema,
  updateDoctorSchema,
  toggleAvailabilitySchema,
  verifyDoctorSchema,
  adminQuerySchema,
} from './schemas.js';
import { validate } from '../../shared/middleware/validate.js';

export class AdminController {
  constructor(private adminService: AdminService) {}

  adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const result = await this.adminService.adminLogin(input);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(
        ApiResponseBuilder.success(
          { accessToken: result.accessToken, admin: result.admin },
          'Admin login successful'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  createDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const doctor = await this.adminService.createDoctor(input);
      res.status(201).json(ApiResponseBuilder.created(doctor, 'Doctor created successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const result = await this.adminService.getDoctors(query);
      res.json(ApiResponseBuilder.success(result, 'Doctors retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const doctor = await this.adminService.getDoctorById(id);
      res.json(ApiResponseBuilder.success(doctor, 'Doctor retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const input = req.body;
      const doctor = await this.adminService.updateDoctor(id, input);
      res.json(ApiResponseBuilder.success(doctor, 'Doctor updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  toggleDoctorAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const input = req.body;
      const doctor = await this.adminService.toggleDoctorAvailability(id, input);
      res.json(
        ApiResponseBuilder.success(
          doctor,
          `Doctor ${input.available ? 'activated' : 'deactivated'} successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  verifyDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const input = req.body;
      const doctor = await this.adminService.verifyDoctor(id, input);
      res.json(
        ApiResponseBuilder.success(
          doctor,
          `Doctor ${input.isVerified ? 'verified' : 'unverified'} successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  deleteDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      await this.adminService.deleteDoctor(id);
      res.json(ApiResponseBuilder.success(null, 'Doctor deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const result = await this.adminService.getUsers(query);
      res.json(ApiResponseBuilder.success(result, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getAllAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const result = await this.adminService.getAllAppointments(query);
      res.json(ApiResponseBuilder.success(result, 'Appointments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json(ApiResponseBuilder.success(stats, 'Dashboard stats retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}
