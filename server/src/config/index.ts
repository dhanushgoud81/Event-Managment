import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_NAME: z.string().default('Event Management System'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:5000'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),

  // Email
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Event Management <noreply@eventmanagement.com>'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),

  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCK_TIME_MINUTES: z.coerce.number().default(30),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@eventmanagement.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  SUPER_ADMIN_FIRST_NAME: z.string().default('Super'),
  SUPER_ADMIN_LAST_NAME: z.string().default('Admin'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  appName: parsed.data.APP_NAME,
  appUrl: parsed.data.APP_URL,
  apiUrl: parsed.data.API_URL,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',

  db: {
    url: parsed.data.DATABASE_URL,
  },

  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiry: parsed.data.JWT_ACCESS_EXPIRY,
    refreshExpiry: parsed.data.JWT_REFRESH_EXPIRY,
  },

  redis: {
    host: parsed.data.REDIS_HOST,
    port: parsed.data.REDIS_PORT,
    password: parsed.data.REDIS_PASSWORD || undefined,
    db: parsed.data.REDIS_DB,
  },

  email: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    secure: parsed.data.SMTP_SECURE,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.EMAIL_FROM,
  },

  razorpay: {
    keyId: parsed.data.RAZORPAY_KEY_ID,
    keySecret: parsed.data.RAZORPAY_KEY_SECRET,
    webhookSecret: parsed.data.RAZORPAY_WEBHOOK_SECRET,
  },

  upload: {
    dir: parsed.data.UPLOAD_DIR,
    maxFileSize: parsed.data.MAX_FILE_SIZE,
    allowedTypes: parsed.data.ALLOWED_FILE_TYPES.split(','),
  },

  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
    authMax: parsed.data.AUTH_RATE_LIMIT_MAX,
  },

  security: {
    bcryptRounds: parsed.data.BCRYPT_ROUNDS,
    maxLoginAttempts: parsed.data.MAX_LOGIN_ATTEMPTS,
    lockTimeMinutes: parsed.data.LOCK_TIME_MINUTES,
    corsOrigin: parsed.data.CORS_ORIGIN,
  },

  superAdmin: {
    email: parsed.data.SUPER_ADMIN_EMAIL,
    password: parsed.data.SUPER_ADMIN_PASSWORD,
    firstName: parsed.data.SUPER_ADMIN_FIRST_NAME,
    lastName: parsed.data.SUPER_ADMIN_LAST_NAME,
  },
} as const;

export type Config = typeof config;
