import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Entrada: schema: esquema Zod de validación; target: sección de la petición a validar (body, query o params).
 * Proceso: Ejecuta safeParse sobre el target indicado y delega errores al middleware global o continúa la cadena.
 * Salida: Retorna un middleware Express que valida la petición antes de llegar al controlador.
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(result.error);
      return;
    }

    req[target] = result.data;
    next();
  };
};
