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
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
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
      ...(errors && { errors }),
    };
  }
}
