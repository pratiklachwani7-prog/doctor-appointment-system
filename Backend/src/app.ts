import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import logger from './shared/utils/logger.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { apiRateLimiter } from './shared/middleware/rateLimiter.js';
// Import routes
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import doctorRoutes from './modules/doctors/routes.js';
import appointmentRoutes from './modules/appointments/routes.js';
import adminRoutes from './modules/admin/routes.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use(apiRateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip }, 'Incoming request');
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
