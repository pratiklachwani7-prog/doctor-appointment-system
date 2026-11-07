import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './schemas.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registerSchema.parse(req.body).body;
      const result = await this.authService.register(input);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json(
        ApiResponseBuilder.created(
          {
            user: result.user,
            accessToken: result.tokens.accessToken,
          },
          'User registered successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body).body;
      const result = await this.authService.login(input);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(
        ApiResponseBuilder.success(
          {
            user: result.user,
            accessToken: result.tokens.accessToken,
          },
          'Logged in successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Refresh token required'
        );
      }

      const tokens = await this.authService.refreshTokens({ refreshToken });

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(
        ApiResponseBuilder.success(
          {
            accessToken: tokens.accessToken,
          },
          'Tokens refreshed successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Authentication required'
        );
      }

      await this.authService.logout(req.user.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.json(ApiResponseBuilder.success(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
          'Authentication required'
        );
      }

      const profile = await this.authService.getProfile(req.user.id);
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

      const updateData = req.body;
      const profile = await this.authService.updateProfile(req.user.id, updateData);
      res.json(ApiResponseBuilder.success(profile, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  };
}
