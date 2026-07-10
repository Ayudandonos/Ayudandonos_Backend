import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app.error.js';
import { jwtUtil } from '../utils/jwt.util.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

/**
 * Entrada: req: petición HTTP; _res: respuesta HTTP; next: siguiente middleware.
 * Proceso: Intenta autenticar si hay token Bearer; continua sin usuario si no hay token o es invalido.
 * Salida: No retorna valor; llama a next() con req.user opcional.
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwtUtil.verify(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    req.user = undefined;
  }

  next();
};

/**
 * Entrada: req: petición HTTP; _res: respuesta HTTP; next: siguiente middleware.
 * Proceso: Extrae el token Bearer del encabezado Authorization, lo verifica y adjunta el usuario a la petición.
 * Salida: No retorna valor; llama a next() si la autenticación es exitosa o lanza AppError en caso contrario.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(API_MESSAGES.AUTH_TOKEN_REQUIRED, 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = jwtUtil.verify(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  next();
};

/**
 * Entrada: roles: lista de roles permitidos para acceder al recurso.
 * Proceso: Verifica que exista un usuario autenticado y que su rol esté incluido en la lista permitida.
 * Salida: Retorna un middleware Express que autoriza o rechaza el acceso según el rol del usuario.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(API_MESSAGES.AUTH_UNAUTHORIZED, 401);
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }

    next();
  };
};
