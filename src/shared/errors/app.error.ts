export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  /**
   * Entrada: message: mensaje de error; statusCode: código HTTP; isOperational: indica si es un error esperado; errors: detalle por campo.
   * Proceso: Inicializa una instancia de error operacional con código de estado HTTP y metadatos opcionales.
   * Salida: Retorna una instancia de AppError lista para ser manejada por el middleware global.
   */
  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
