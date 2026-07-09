import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// Entrada:
// fn: controlador asíncrono que maneja la petición HTTP.

// Proceso:
// Envuelve el controlador en una promesa y delega cualquier error rechazado al middleware global.

// Salida:
// Retorna un RequestHandler compatible con Express que captura errores asíncronos.
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
