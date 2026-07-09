/**
 * Mensajes de respuesta de la API dirigidos al usuario final.
 * Los identificadores estan en ingles; el contenido visible es en espanol.
 */
export const API_MESSAGES = {
  SUCCESS_DEFAULT: 'Operación exitosa',
  ROUTE_NOT_FOUND: 'Ruta no encontrada',
  VALIDATION_ERROR: 'Error de validación',
  INTERNAL_SERVER_ERROR: 'Error interno del servidor',
  AUTH_TOKEN_REQUIRED: 'Token de autenticación requerido',
  AUTH_TOKEN_INVALID: 'Token inválido o expirado',
  AUTH_UNAUTHORIZED: 'No autenticado',
  AUTH_FORBIDDEN: 'No autorizado para esta acción',
  ENDPOINT_IN_DEVELOPMENT: 'Endpoint en desarrollo — Fase 2',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
} as const;

/**
 * Mensajes de validacion para esquemas Zod.
 */
export const VALIDATION_MESSAGES = {
  INVALID_EMAIL: 'Email inválido',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_UPPERCASE: 'Debe contener al menos una mayúscula',
  PASSWORD_NUMBER: 'Debe contener al menos un número',
  FULL_NAME_MIN_LENGTH: 'El nombre debe tener al menos 2 caracteres',
} as const;

/**
 * Mensajes de consola para el equipo de desarrollo.
 */
export const CONSOLE_MESSAGES = {
  ENV_INVALID: '[ERROR] Variables de entorno inválidas:',
  DB_CONNECTED: '[OK] Conexión a base de datos establecida',
  DB_UNAVAILABLE:
    '[ADVERTENCIA] Base de datos no disponible. El servidor iniciará sin conexión a BD.',
  DB_CONFIG_HINT: '           Configura DATABASE_URL en backend/.env (Fase 2).',
  SERVER_RUNNING: (port: number) => `[INFO] Servidor corriendo en http://localhost:${port}`,
  SWAGGER_AVAILABLE: (port: number) =>
    `[INFO] Swagger disponible en http://localhost:${port}/api/v1/docs`,
  ENVIRONMENT: (env: string) => `[INFO] Entorno: ${env}`,
  SERVER_SHUTDOWN: (signal: string) => `\n${signal} recibido. Cerrando servidor...`,
  SERVER_CLOSED: 'Servidor cerrado correctamente',
  SERVER_START_ERROR: '[ERROR] Error al iniciar el servidor:',
} as const;
