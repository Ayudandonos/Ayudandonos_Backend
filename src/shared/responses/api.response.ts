import { API_MESSAGES } from '../constants/messages.constants.js';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  errors: null;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]> | null;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponseBuilder {
  // Entrada:
  // data: cuerpo de la respuesta; message: mensaje opcional; meta: metadatos de paginación opcionales.

  // Proceso:
  // Construye un objeto de respuesta exitosa con la estructura estándar de la API.

  // Salida:
  // Retorna el objeto ApiSuccessResponse listo para serializar.
  static success<T>(
    data: T,
    message: string = API_MESSAGES.SUCCESS_DEFAULT,
    meta?: ApiResponseMeta,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      errors: null,
      ...(meta && { meta }),
    };
  }

  // Entrada:
  // message: mensaje de error; errors: detalle de errores por campo opcional.

  // Proceso:
  // Construye un objeto de respuesta de error con la estructura estándar de la API.

  // Salida:
  // Retorna el objeto ApiErrorResponse listo para serializar.
  static error(
    message: string,
    errors?: Record<string, string[]>,
  ): ApiErrorResponse {
    return {
      success: false,
      message,
      data: null,
      errors: errors ?? null,
    };
  }
}
