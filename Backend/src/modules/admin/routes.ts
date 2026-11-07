import { Router } from 'express';
import { AdminController } from './controller.js';
import { AdminService } from './service.js';
import { AdminRepository } from './repository.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireAdmin } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  adminLoginSchema,
  createDoctorSchema,
  updateDoctorSchema,
  toggleAvailabilitySchema,
  verifyDoctorSchema,
  adminQuerySchema,
} from './schemas.js';
import { UserModel, DoctorModel, AppointmentModel } from '../../models/index.js';

const router = Router();

// Initialize dependencies
const adminRepository = new AdminRepository(UserModel, DoctorModel, AppointmentModel);
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

// Public admin login (no auth required)
router.post('/login', validate(adminLoginSchema), adminController.adminLogin);

// Protected admin routes (require admin role)
router.get('/dashboard', authMiddleware, requireAdmin, adminController.getDashboardStats);

// Doctor management
router.post(
  '/doctors',
  authMiddleware,
  requireAdmin,
  validate(createDoctorSchema),
  adminController.createDoctor
);
router.get(
  '/doctors',
  authMiddleware,
  requireAdmin,
  validate(adminQuerySchema),
  adminController.getDoctors
);
router.get('/doctors/:id', authMiddleware, requireAdmin, adminController.getDoctorById);
router.put(
  '/doctors/:id',
  authMiddleware,
  requireAdmin,
  validate(updateDoctorSchema),
  adminController.updateDoctor
);
router.patch(
  '/doctors/:id/availability',
  authMiddleware,
  requireAdmin,
  validate(toggleAvailabilitySchema),
  adminController.toggleDoctorAvailability
);
router.patch(
  '/doctors/:id/verify',
  authMiddleware,
  requireAdmin,
  validate(verifyDoctorSchema),
  adminController.verifyDoctor
);
router.delete('/doctors/:id', authMiddleware, requireAdmin, adminController.deleteDoctor);

// User management
router.get(
  '/users',
  authMiddleware,
  requireAdmin,
  validate(adminQuerySchema),
  adminController.getUsers
);

// Appointment management
router.get(
  '/appointments',
  authMiddleware,
  requireAdmin,
  validate(adminQuerySchema),
  adminController.getAllAppointments
);

export default router;
