import { env } from './env.config.js';

export const corsConfig = {
  origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
