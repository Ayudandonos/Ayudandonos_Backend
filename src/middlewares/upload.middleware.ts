import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { uploadConfig } from '../config/env.config.js';
import { AppError } from '../shared/errors/app.error.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: uploadConfig.maxFileSizeBytes },
});

/**
 * Entrada: err: error de multer; mimeTypes: lista blanca de MIME permitidos.
 * Proceso: Normaliza errores de carga de archivos a AppError.
 * Salida: Retorna void o lanza AppError.
 */
function assertValidUpload(
  err: unknown,
  mimeTypes: readonly string[],
  file?: Express.Multer.File,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new AppError(API_MESSAGES.UPLOAD_FILE_TOO_LARGE, 400);
    }
    throw new AppError(API_MESSAGES.UPLOAD_INVALID_FILE, 400);
  }

  if (err) {
    throw err;
  }

  if (!file) {
    throw new AppError(API_MESSAGES.UPLOAD_FILE_REQUIRED, 400);
  }

  if (!mimeTypes.includes(file.mimetype)) {
    throw new AppError(API_MESSAGES.UPLOAD_INVALID_MIME_TYPE, 400);
  }
}

/**
 * Entrada: Ninguna.
 * Proceso: Configura middleware para subida de logo de fundacion.
 * Salida: Retorna middleware Express para campo "logo".
 */
export const foundationLogoUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('logo')(req, res, (err) => {
    try {
      assertValidUpload(err, uploadConfig.allowedLogoMimeTypes, req.file);
      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Entrada: Ninguna.
 * Proceso: Configura middleware para subida de documentos de fundacion.
 * Salida: Retorna middleware Express para campo "file".
 */
export const foundationDocumentUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single('file')(req, res, (err) => {
    try {
      assertValidUpload(err, uploadConfig.allowedDocumentMimeTypes, req.file);
      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Entrada: Ninguna.
 * Proceso: Configura middleware para subida de avatar de usuario.
 * Salida: Retorna middleware Express para campo "avatar".
 */
export const userAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('avatar')(req, res, (err) => {
    try {
      assertValidUpload(err, uploadConfig.allowedLogoMimeTypes, req.file);
      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Entrada: Ninguna.
 * Proceso: Configura middleware para subida de imagen de campana.
 * Salida: Retorna middleware Express para campo "image".
 */
export const campaignImageUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err) => {
    try {
      assertValidUpload(err, uploadConfig.allowedLogoMimeTypes, req.file);
      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Entrada: Ninguna.
 * Proceso: Configura middleware para subida multiple de imagenes de entrega/post.
 * Salida: Retorna middleware Express para campo "images" (minimo 3 en servicio).
 */
export const postImagesUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 10)(req, res, (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          throw new AppError(API_MESSAGES.UPLOAD_FILE_TOO_LARGE, 400);
        }
        throw new AppError(API_MESSAGES.UPLOAD_INVALID_FILE, 400);
      }

      if (err) {
        throw err;
      }

      const files = req.files;
      if (!Array.isArray(files) || files.length === 0) {
        throw new AppError(API_MESSAGES.UPLOAD_FILE_REQUIRED, 400);
      }

      const allowedMimeTypes: readonly string[] = uploadConfig.allowedLogoMimeTypes;

      for (const file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new AppError(API_MESSAGES.UPLOAD_INVALID_MIME_TYPE, 400);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  });
};
