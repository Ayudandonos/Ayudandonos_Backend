import { env } from './env.config.js';

export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
} as const;
