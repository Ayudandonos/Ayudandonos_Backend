import { env } from './env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: API_MESSAGES.RATE_LIMIT_EXCEEDED,
  },
};
