import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app.error.js';
import { API_MESSAGES } from '../constants/messages.constants.js';

type NodeErrnoError = Error & {
  code?: string;
};

/**
 * Entrada: error: valor desconocido capturado en catch.
 * Proceso: Traduce errores de Prisma y de sistema de archivos a AppError con mensaje claro.
 * Salida: Retorna AppError operacional o el error original si no es mapeable.
 */
export function mapUnknownError(error: unknown): Error {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mapPrismaKnownError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError(
      API_MESSAGES.DATABASE_VALIDATION_ERROR,
      400,
      true,
      {
        details: [sanitizeMessage(error.message)],
      },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(
      API_MESSAGES.DATABASE_CONNECTION_ERROR,
      503,
      true,
      {
        details: [sanitizeMessage(error.message)],
      },
    );
  }

  if (isNodeErrnoError(error)) {
    return mapFilesystemError(error);
  }

  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Entrada: error: error conocido de Prisma.
 * Proceso: Asocia codigos Prisma frecuentes a mensajes de API legibles.
 * Salida: Retorna AppError con status HTTP apropiado.
 */
function mapPrismaKnownError(
  error: Prisma.PrismaClientKnownRequestError,
): AppError {
  const details = [
    `Prisma ${error.code}${error.meta ? `: ${JSON.stringify(error.meta)}` : ''}`,
  ];

  switch (error.code) {
    case 'P2002': {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(',')
        : String(error.meta?.target ?? '');

      if (target.includes('email')) {
        return new AppError(API_MESSAGES.AUTH_EMAIL_ALREADY_EXISTS, 409, true, {
          details,
        });
      }

      if (target.includes('nit')) {
        return new AppError(API_MESSAGES.FOUNDATIONS_NIT_ALREADY_EXISTS, 409, true, {
          details,
        });
      }

      return new AppError(API_MESSAGES.DATABASE_DUPLICATE_RECORD, 409, true, {
        details,
      });
    }
    case 'P2021':
    case 'P2022':
      return new AppError(API_MESSAGES.DATABASE_SCHEMA_OUTDATED, 503, true, {
        details,
      });
    case 'P1001':
    case 'P1002':
    case 'P1017':
      return new AppError(API_MESSAGES.DATABASE_CONNECTION_ERROR, 503, true, {
        details,
      });
    default:
      return new AppError(API_MESSAGES.DATABASE_QUERY_FAILED, 500, true, {
        details: [sanitizeMessage(error.message), ...details],
      });
  }
}

/**
 * Entrada: error: error de Node con codigo errno.
 * Proceso: Detecta fallos tipicos de escritura en disco (Vercel read-only, permisos).
 * Salida: Retorna AppError de almacenamiento o de archivo.
 */
function mapFilesystemError(error: NodeErrnoError): AppError {
  const code = error.code ?? 'UNKNOWN';
  const details = [`FS ${code}: ${sanitizeMessage(error.message)}`];

  if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
    return new AppError(API_MESSAGES.UPLOAD_STORAGE_UNAVAILABLE, 503, true, {
      details,
    });
  }

  if (code === 'ENOENT') {
    return new AppError(API_MESSAGES.UPLOAD_FILE_NOT_FOUND, 404, true, {
      details,
    });
  }

  if (code === 'ENOSPC') {
    return new AppError(API_MESSAGES.UPLOAD_STORAGE_FULL, 507, true, {
      details,
    });
  }

  return new AppError(API_MESSAGES.UPLOAD_STORAGE_FAILED, 500, true, {
    details,
  });
}

/**
 * Entrada: error: valor desconocido.
 * Proceso: Verifica si es un Error de Node con propiedad code.
 * Salida: Retorna true si parece un errno error.
 */
function isNodeErrnoError(error: unknown): error is NodeErrnoError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as NodeErrnoError).code === 'string'
  );
}

/**
 * Entrada: message: mensaje crudo de libreria.
 * Proceso: Recorta longitud para no exponer dumps enormes al cliente.
 * Salida: Retorna mensaje sanitizado.
 */
function sanitizeMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, 500);
}
