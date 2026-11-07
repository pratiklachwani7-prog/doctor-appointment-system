import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../../shared/utils/logger.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
  InternalError,
} from '../../shared/utils/errors.js';
import { ApiResponseBuilder } from '../../shared/utils/apiResponse.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  if (err instanceof ZodError) {
    const validationError = new ValidationError(err.errors, 'Validation failed');
    return sendErrorResponse(res, validationError);
  }

  if (err instanceof AppError) {
    return sendErrorResponse(res, err);
  }

  // Unknown error
  const internalError = new InternalError();
  sendErrorResponse(res, internalError);
}

function sendErrorResponse(
  res: Response,
  error: { statusCode: number; code: string; message: string; details?: unknown }
): void {
  const response = ApiResponseBuilder.error(
    error.statusCode,
    error.code,
    error.message,
    error.details
  );
  res.status(error.statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  sendErrorResponse(res, error);
}
