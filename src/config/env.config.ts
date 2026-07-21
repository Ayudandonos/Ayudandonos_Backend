import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';
import { CONSOLE_MESSAGES } from '../shared/constants/messages.constants.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  VERCEL_URL: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(CONSOLE_MESSAGES.ENV_INVALID, parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';

export const uploadConfig = {
  rootDir: path.resolve(process.cwd(), env.UPLOAD_DIR),
  foundationsDir: 'foundations',
  maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
  allowedLogoMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  allowedDocumentMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, ''),
};
