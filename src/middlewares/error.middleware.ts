import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/app.error.js';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { isDevelopment } from '../config/env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

// Entrada:
// err: error capturado; _req: petición HTTP; res: respuesta HTTP; _next: siguiente middleware.

// Proceso:
// Clasifica el error (AppError, ZodError u otro) y construye la respuesta HTTP correspondiente.

// Salida:
// No retorna valor; envía la respuesta JSON con el código de estado adecuado.
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      ApiResponseBuilder.error(err.message, err.errors),
    );
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });

    res.status(400).json(
      ApiResponseBuilder.error(API_MESSAGES.VALIDATION_ERROR, errors),
    );
    return;
  }

  console.error('Error no controlado:', err);

  res.status(500).json(
    ApiResponseBuilder.error(
      isDevelopment ? err.message : API_MESSAGES.INTERNAL_SERVER_ERROR,
    ),
  );
};
