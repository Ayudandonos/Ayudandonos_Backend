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
  FOUNDATIONS_LIST_SUCCESS: 'Listado de fundaciones obtenido correctamente',
  FOUNDATIONS_FOUND_SUCCESS: 'Fundación obtenida correctamente',
  FOUNDATIONS_UPDATE_SUCCESS: 'Fundación actualizada correctamente',
  FOUNDATIONS_STATUS_UPDATE_SUCCESS: 'Estado de fundación actualizado correctamente',
  FOUNDATIONS_LOGO_UPLOAD_SUCCESS: 'Logo de fundación actualizado correctamente',
  FOUNDATIONS_DOCUMENT_UPLOAD_SUCCESS: 'Documento de fundación cargado correctamente',
  FOUNDATIONS_NOT_FOUND: 'Fundación no encontrada',
  FOUNDATIONS_NOT_PUBLIC: 'Esta fundación no está disponible públicamente',
  FOUNDATIONS_CANNOT_MANAGE_OTHERS: 'No tienes permiso para gestionar esta fundación',
  FOUNDATIONS_NIT_ALREADY_EXISTS: 'El NIT ya está registrado en otra fundación',
  FOUNDATIONS_STATUS_ALREADY_SET: 'La fundación ya tiene ese estado',
  FOUNDATIONS_PROFILE_INCOMPLETE: 'El perfil de la fundación está incompleto para verificación',
  FOUNDATIONS_ACCESS_PROFILE_REQUIRED:
    'Completa tu perfil y documentos obligatorios antes de acceder a este recurso',
  FOUNDATIONS_ACCESS_VERIFICATION_REQUIRED:
    'Tu fundación debe ser verificada por un administrador antes de acceder a este recurso',
  FOUNDATIONS_DOCUMENTS_INCOMPLETE: 'Faltan documentos obligatorios para verificar la fundación',
  FOUNDATIONS_DOCUMENT_NOT_FOUND: 'Documento de fundación no encontrado',
  UPLOAD_FILE_REQUIRED: 'Debe adjuntar un archivo',
  UPLOAD_FILE_TOO_LARGE: 'El archivo supera el tamaño máximo permitido',
  UPLOAD_INVALID_FILE: 'Archivo inválido',
  UPLOAD_INVALID_MIME_TYPE: 'Tipo de archivo no permitido',
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
    'La descripción no puede superar los 2000 caracteres',
  FOUNDATION_MISSION_MAX_LENGTH: 'La misión no puede superar los 1000 caracteres',
  FOUNDATION_VISION_MAX_LENGTH: 'La visión no puede superar los 1000 caracteres',
  FOUNDATION_NIT_MIN_LENGTH: 'El NIT debe tener al menos 5 caracteres',
  FOUNDATION_NIT_MAX_LENGTH: 'El NIT no puede superar los 20 caracteres',
  FOUNDATION_ACRONYM_MIN_LENGTH: 'La sigla debe tener al menos 2 caracteres',
  FOUNDATION_ACRONYM_MAX_LENGTH: 'La sigla no puede superar los 20 caracteres',
  FOUNDATION_CATEGORY_MIN_LENGTH: 'La categoría debe tener al menos 2 caracteres',
  FOUNDATION_CITY_MIN_LENGTH: 'La ciudad debe tener al menos 2 caracteres',
  FOUNDATION_DEPARTMENT_MIN_LENGTH: 'El departamento debe tener al menos 2 caracteres',
  FOUNDATION_ADDRESS_MIN_LENGTH: 'La dirección debe tener al menos 5 caracteres',
  FOUNDATION_PHONE_MIN_LENGTH: 'El teléfono debe tener al menos 7 caracteres',
  FOUNDATION_PHONE_MAX_LENGTH: 'El teléfono no puede superar los 20 caracteres',
  FOUNDATION_REPRESENTATIVE_DOCUMENT_MIN_LENGTH:
    'El documento del representante debe tener al menos 5 caracteres',
  FOUNDATION_REJECTION_REASON_REQUIRED: 'Debe indicar el motivo del rechazo',
  FOUNDATION_REJECTION_REASON_MAX_LENGTH:
    'El motivo de rechazo no puede superar los 1000 caracteres',
  FOUNDATION_ADMIN_NOTES_MAX_LENGTH:
    'Las observaciones del administrador no pueden superar los 2000 caracteres',
  INVALID_URL: 'URL inválida',
  INVALID_UUID: 'Identificador de usuario inválido',
  INVALID_FOUNDATION_UUID: 'Identificador de fundación inválido',
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
