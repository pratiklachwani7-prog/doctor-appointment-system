import { Router } from 'express';
import { AuthController } from './controller.js';
import { AuthService } from './service.js';
import { AuthRepository } from './repository.js';
import { validate } from '../../shared/middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { UserModel, RefreshTokenModel } from '../../models/index.js';
import { UserDocument, RefreshTokenDocument } from './types.js';

const router = Router();

// Initialize dependencies
const authRepository = new AuthRepository(UserModel as any, RefreshTokenModel as any);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

export default router;
