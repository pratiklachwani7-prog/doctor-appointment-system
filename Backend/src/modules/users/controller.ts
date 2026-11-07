import { Request, Response, NextFunction } from 'express';
import { UserService } from './service.js';
import { updateProfileSchema, changePasswordSchema } from './schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireAdmin } from '../../shared/middleware/rbac.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';
import { ValidationError } from '../../shared/utils/errors.js';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Authentication required'
        );
      }

      const profile = await this.userService.getProfile(req.user.id);
      res.json(ApiResponseBuilder.success(profile, 'Profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Authentication required'
        );
      }

      const input = req.body;
      const profile = await this.userService.updateProfile(req.user.id, input);
      res.json(ApiResponseBuilder.success(profile, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Authentication required'
        );
      }

      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(req.user.id, { currentPassword, newPassword });
      res.json(ApiResponseBuilder.success(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string | undefined;

      const result = await this.userService.getUsers(page, limit, role);
      res.json(ApiResponseBuilder.success(result, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}
