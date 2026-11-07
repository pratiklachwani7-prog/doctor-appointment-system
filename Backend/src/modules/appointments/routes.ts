import { Router } from 'express';
import { AppointmentController } from './controller.js';
import { AppointmentService } from './service.js';
import { AppointmentRepository } from './repository.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireAdmin, requireDoctor } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentQuerySchema,
} from './schemas.js';
import { AppointmentModel, DoctorModel, UserModel } from '../../models/index.js';

const router = Router();

// Initialize dependencies
const appointmentRepository = new AppointmentRepository(AppointmentModel);
const doctorRepository = new (require('../doctors/repository.js').DoctorRepository)(DoctorModel);
const userRepository = new (require('../users/repository.js').UserRepository)(UserModel);
const appointmentService = new AppointmentService(
  appointmentRepository,
  doctorRepository,
  userRepository
);
const appointmentController = new AppointmentController(appointmentService);

// Patient routes (require authentication)
router.post(
  '/',
  authMiddleware,
  validate(bookAppointmentSchema),
  appointmentController.bookAppointment
);
router.post(
  '/cancel',
  authMiddleware,
  validate(cancelAppointmentSchema),
  appointmentController.cancelAppointment
);
router.post(
  '/reschedule',
  authMiddleware,
  validate(rescheduleAppointmentSchema),
  appointmentController.rescheduleAppointment
);
router.get(
  '/my-appointments',
  authMiddleware,
  validate(appointmentQuerySchema),
  appointmentController.getMyAppointments
);

// Doctor routes (require doctor role)
router.get(
  '/doctor',
  authMiddleware,
  requireDoctor,
  validate(appointmentQuerySchema),
  appointmentController.getDoctorAppointments
);

// Admin routes (require admin role)
router.get(
  '/',
  authMiddleware,
  requireAdmin,
  validate(appointmentQuerySchema),
  appointmentController.getAllAppointments
);
router.get('/:id', authMiddleware, appointmentController.getAppointmentById);
router.patch(
  '/:id/status',
  authMiddleware,
  requireAdmin,
  appointmentController.updateAppointmentStatus
);

export default router;
