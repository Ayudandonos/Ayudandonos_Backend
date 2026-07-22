import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/app.error.js';
import { mapUnknownError } from '../shared/errors/map-unknown-error.js';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { isDevelopment } from '../config/env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

/**
 * Entrada: err: error capturado; req: peticion HTTP; res: respuesta HTTP; _next: siguiente middleware.
 * Proceso: Clasifica el error (AppError, Zod, Prisma, FS u otro), lo registra y responde JSON.
 * Salida: No retorna valor; envia la respuesta con codigo HTTP adecuado y detalle util.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const mapped = mapUnknownError(err);

  if (mapped instanceof AppError) {
    if (!mapped.isOperational || mapped.statusCode >= 500) {
      logError(req, mapped);
    }

    res.status(mapped.statusCode).json(
      ApiResponseBuilder.error(mapped.message, mapped.errors),
    );
    return;
  }

  if (mapped instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    mapped.errors.forEach((issue) => {
      const path = issue.path.join('.') || '_form';
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });

    res.status(400).json(
      ApiResponseBuilder.error(API_MESSAGES.VALIDATION_ERROR, errors),
    );
    return;
  }

  logError(req, mapped);

  const clientMessage = isDevelopment
    ? mapped.message
    : API_MESSAGES.INTERNAL_SERVER_ERROR;

  res.status(500).json(
    ApiResponseBuilder.error(clientMessage, {
      details: [mapped.message.slice(0, 500)],
    }),
  );
};

/**
 * Entrada: req: peticion HTTP; error: error a registrar.
 * Proceso: Escribe en consola metodo, ruta y detalle del fallo.
 * Salida: No retorna valor.
 */
function logError(req: Request, error: Error): void {
  const appError = error instanceof AppError ? error : null;

  console.error('[API_ERROR]', {
    method: req.method,
    path: req.originalUrl,
    statusCode: appError?.statusCode ?? 500,
    message: error.message,
    errors: appError?.errors ?? null,
    stack: error.stack,
  });
}
