import type { CorsOptions } from 'cors';
import { env } from './env.config.js';

// Entrada:
// Ninguna.

// Proceso:
// Parsea los origenes permitidos desde CORS_ORIGIN (lista separada por comas).

// Salida:
// Retorna arreglo de origenes sin espacios ni slash final.
function parseAllowedOrigins(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

export const corsConfig: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
