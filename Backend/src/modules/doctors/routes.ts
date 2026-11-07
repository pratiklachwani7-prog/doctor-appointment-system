import { Router } from 'express';
import { DoctorController } from './controller.js';
import { DoctorService } from './service.js';
import { DoctorRepository } from './repository.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireDoctor, requireAdmin } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  setAvailabilitySchema,
  addLeaveSchema,
} from './schemas.js';
import { DoctorModel } from '../../models/index.js';

const router = Router();

// Initialize dependencies
const doctorRepository = new DoctorRepository(DoctorModel);
const doctorService = new DoctorService(doctorRepository);
const doctorController = new DoctorController(doctorService);

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/specialty/:specialty', doctorController.getDoctorsBySpecialty);
router.get('/:id', doctorController.getDoctorById);

// Protected routes (require authentication)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createDoctorSchema),
  doctorController.createDoctor
);
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateDoctorSchema),
  doctorController.updateDoctor
);
router.post(
  '/:id/availability',
  authMiddleware,
  requireDoctor,
  validate(setAvailabilitySchema),
  doctorController.setAvailability
);
router.post(
  '/:id/leave',
  authMiddleware,
  requireDoctor,
  validate(addLeaveSchema),
  doctorController.addLeave
);

export default router;
