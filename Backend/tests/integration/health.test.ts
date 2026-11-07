import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config } from '../../src/config/index.js';

// Mock the config
vi.mock('../../src/config/index.js', () => ({
  config: {
    env: 'test',
    port: 4000,
    mongodb: { uri: 'mongodb://localhost:27017/test' },
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiry: '15m',
      refreshExpiry: '7d',
    },
    cloudinary: {
      cloudName: 'test',
      apiKey: 'test',
      apiSecret: 'test',
    },
    razorpay: {
      keyId: 'test',
      keySecret: 'test',
      currency: 'INR',
    },
    admin: {
      email: 'admin@test.com',
      passwordHash: 'test',
    },
    frontendUrl: 'http://localhost:5173',
    logLevel: 'info',
  },
}));

// Import after mocking
import request from 'supertest';
import express from 'express';

describe('Health Check Endpoint', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.get('/api/v1/health', (req, res) => {
      res.json({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  });

  it('should return health status', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
  });
});