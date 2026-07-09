import type { JwtPayload } from '../utils/jwt.util.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export type AuthenticatedRequest = Express.Request & {
  user: NonNullable<Express.Request['user']>;
};

export type { JwtPayload };
