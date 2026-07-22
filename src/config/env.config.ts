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
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  VERCEL_URL: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
  CSC_API_KEY: z.string().min(1).optional(),
  CSC_API_BASE_URL: z.string().url().default('https://api.countrystatecity.in/v1'),
  CSC_CACHE_TTL_MS: z.coerce.number().default(86_400_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(CONSOLE_MESSAGES.ENV_INVALID, parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isVercelRuntime = Boolean(process.env.VERCEL);

const resolvedUploadRoot = isVercelRuntime
  ? path.join('/tmp', env.UPLOAD_DIR)
  : path.resolve(process.cwd(), env.UPLOAD_DIR);

export const uploadConfig = {
  rootDir: resolvedUploadRoot,
  foundationsDir: 'foundations',
  maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
  allowedLogoMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  allowedDocumentMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, ''),
};

export const cscConfig = {
  apiKey: env.CSC_API_KEY ?? '',
  baseUrl: env.CSC_API_BASE_URL.replace(/\/$/, ''),
  cacheTtlMs: env.CSC_CACHE_TTL_MS,
};
