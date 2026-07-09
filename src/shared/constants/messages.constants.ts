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
  AUTH_INVALID_CREDENTIALS: 'Credenciales inválidas',
  AUTH_EMAIL_ALREADY_EXISTS: 'El correo electrónico ya está registrado',
  AUTH_USER_NOT_FOUND: 'Usuario no encontrado',
  AUTH_USER_INACTIVE: 'La cuenta está desactivada',
  AUTH_REGISTER_USER_SUCCESS: 'Registro de usuario exitoso',
  AUTH_REGISTER_FOUNDATION_SUCCESS: 'Registro de fundación exitoso',
  AUTH_LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  AUTH_LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
  AUTH_ME_SUCCESS: 'Perfil obtenido correctamente',
  USERS_LIST_SUCCESS: 'Listado de usuarios obtenido correctamente',
  USERS_FOUND_SUCCESS: 'Usuario obtenido correctamente',
  USERS_UPDATE_SUCCESS: 'Usuario actualizado correctamente',
  USERS_DEACTIVATE_SUCCESS: 'Usuario desactivado correctamente',
  USERS_CANNOT_ACCESS_OTHERS: 'No tienes permiso para acceder a este usuario',
  USERS_CANNOT_DEACTIVATE_SELF: 'No puedes desactivar tu propia cuenta',
  USERS_ALREADY_INACTIVE: 'El usuario ya está desactivado',
  ENDPOINT_IN_DEVELOPMENT: 'Endpoint en desarrollo — Fase 2',
  API_ROOT_INFO: 'API Ayudandonos operativa. Usa el prefijo /api/v1 en todas las rutas.',
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
  FOUNDATION_NAME_MIN_LENGTH: 'El nombre de la fundación debe tener al menos 2 caracteres',
  FOUNDATION_DESCRIPTION_MAX_LENGTH:
    'La descripción no puede superar los 500 caracteres',
  INVALID_UUID: 'Identificador de usuario inválido',
  UPDATE_EMPTY_BODY: 'Debe enviar al menos un campo para actualizar',
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
