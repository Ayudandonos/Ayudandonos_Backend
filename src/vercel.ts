import { createApp } from './app.js';
import { connectDatabase } from './database/index.js';
import { CONSOLE_MESSAGES } from './shared/constants/messages.constants.js';

const app = createApp();

let databaseInitialization: Promise<void> | null = null;

/**
 * Entrada: Ninguna.
 * Proceso: Inicializa la conexion a base de datos una sola vez por instancia serverless.
 * Salida: Retorna promesa de conexion (exitosa o con advertencia).
 */
function initializeDatabase(): Promise<void> {
  if (!databaseInitialization) {
    databaseInitialization = connectDatabase()
      .then(() => {
        console.log(CONSOLE_MESSAGES.DB_CONNECTED);
      })
      .catch(() => {
        console.warn(CONSOLE_MESSAGES.DB_UNAVAILABLE);
      });
  }

  return databaseInitialization;
}

app.use(async (_req, _res, next) => {
  await initializeDatabase();
  next();
});

export default app;
