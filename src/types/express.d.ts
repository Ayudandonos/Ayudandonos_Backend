import type { JwtPayload } from '../utils/jwt.util.js';
import type { FoundationWithRelations } from '../modules/foundations/foundations.repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      foundation?: FoundationWithRelations;
    }
  }
}

export type AuthenticatedRequest = Express.Request & {
  user: NonNullable<Express.Request['user']>;
};

export type { JwtPayload };
