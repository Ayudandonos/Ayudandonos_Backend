import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/app.error.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';
import {
  isFoundationOperationalReady,
  isFoundationProfileReady,
} from '../modules/foundations/foundation-profile.util.js';
import { foundationsRepository } from '../modules/foundations/foundations.repository.js';

/**
 * Entrada: req: peticion autenticada; _res: respuesta HTTP; next: siguiente middleware.
 * Proceso: Carga la fundacion del usuario FOUNDATION y valida perfil y documentos obligatorios.
 * Salida: No retorna valor; continua la cadena o responde 403 si el perfil no esta listo.
 */
export const requireFoundationProfileReady = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (req.user?.role !== 'FOUNDATION') {
    next();
    return;
  }

  const foundation = await foundationsRepository.findByUserId(req.user.id);

  if (!foundation || !foundation.user.isActive) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
  }

  if (!isFoundationProfileReady(foundation, foundation.documents)) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_ACCESS_PROFILE_REQUIRED, 403);
  }

  req.foundation = foundation;
  next();
};

/**
 * Entrada: req: peticion autenticada; _res: respuesta HTTP; next: siguiente middleware.
 * Proceso: Restringe modulos operativos a fundaciones con perfil completo y verificacion admin.
 * Salida: No retorna valor; continua la cadena o responde 403 segun la restriccion incumplida.
 */
export const requireFoundationOperational = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (req.user?.role !== 'FOUNDATION') {
    next();
    return;
  }

  const foundation =
    req.foundation ?? (await foundationsRepository.findByUserId(req.user.id));

  if (!foundation || !foundation.user.isActive) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
  }

  if (!isFoundationProfileReady(foundation, foundation.documents)) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_ACCESS_PROFILE_REQUIRED, 403);
  }

  if (!isFoundationOperationalReady(foundation, foundation.documents)) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_ACCESS_VERIFICATION_REQUIRED, 403);
  }

  req.foundation = foundation;
  next();
};
