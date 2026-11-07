import { Router } from 'express';
import { UserController } from './controller.js';
import { UserService } from './service.js';
import { UserRepository } from './repository.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireAdmin } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from './schemas.js';
import { UserModel } from '../../models/index.js';
import { UserDocument } from './types.js';

const router = Router();

// Initialize dependencies
const userRepository = new UserRepository(UserModel as any);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), userController.updateProfile);
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  userController.changePassword
);

// Admin routes
router.get('/', authMiddleware, requireAdmin, userController.getUsers);

export default router;
