import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { generalLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import eventRoutes from './events/event.routes';
import registrationRoutes from './registrations/registration.routes';
import paymentRoutes from './payments/payment.routes';
import referralRoutes from './referrals/referral.routes';
import notificationRoutes from './notifications/notification.routes';
import dashboardRoutes from './dashboard/dashboard.routes';

const app = express();

// ─── Security Middleware ─────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", config.appUrl],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: config.security.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 600,
  })
);

// ─── General Middleware ──────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────
app.use('/api/', generalLimiter);

// ─── Static Files (uploads) ─────────────────
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ─── Request Logging ─────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

// ─── Health Check ────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ─── API Routes ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Placeholder routes for future phases
// app.use('/api/reports', reportRoutes);
// app.use('/api/settings', settingsRoutes);

// ─── 404 Handler ─────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Error Handler (must be last) ────────────
app.use(errorHandler);

export default app;
