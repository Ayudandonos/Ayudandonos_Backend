import { env, isDevelopment } from './env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: isDevelopment ? Math.max(env.RATE_LIMIT_MAX, 5000) : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: { path?: string; originalUrl?: string }) => {
    const path = req.originalUrl ?? req.path ?? '';
    return path.includes('/health');
  },
  message: {
    success: false,
    message: API_MESSAGES.RATE_LIMIT_EXCEEDED,
    data: null,
    errors: null,
  },
};
