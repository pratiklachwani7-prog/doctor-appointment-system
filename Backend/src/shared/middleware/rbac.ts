import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../shared/utils/errors.js';
import { UserRole } from '../../shared/constants/roles.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}

export const requirePatient = requireRole(UserRole.PATIENT);
export const requireDoctor = requireRole(UserRole.DOCTOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireDoctorOrAdmin = requireRole(UserRole.DOCTOR, UserRole.ADMIN);
