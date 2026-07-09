import jwt, { type SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config.js';
import { AppError } from '../shared/errors/app.error.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const jwtUtil = {
  // Entrada:
  // payload: datos del usuario a incluir en el token (sub, email, role).

  // Proceso:
  // Firma el payload con el secreto y tiempo de expiración configurados.

  // Salida:
  // Retorna el token JWT firmado como cadena de texto.
  sign(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: jwtConfig.expiresIn as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, jwtConfig.secret, options);
  },

  // Entrada:
  // token: cadena JWT a verificar.

  // Proceso:
  // Verifica la firma y validez del token contra el secreto configurado.

  // Salida:
  // Retorna el payload decodificado o lanza AppError si el token es inválido o expiró.
  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, jwtConfig.secret) as JwtPayload;
    } catch {
      throw new AppError(API_MESSAGES.AUTH_TOKEN_INVALID, 401);
    }
  },
};
