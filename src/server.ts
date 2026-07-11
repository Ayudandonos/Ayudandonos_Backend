import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { connectDatabase, disconnectDatabase } from './database/index.js';
import { CONSOLE_MESSAGES } from './shared/constants/messages.constants.js';

const app = createApp();

/**
 * Entrada: Ninguna; función de arranque del servidor.
 * Proceso: Conecta la base de datos, inicia el servidor HTTP y registra manejadores de cierre graceful.
 * Salida: No retorna valor; mantiene el proceso en ejecución hasta recibir señal de terminación.
 */
async function bootstrap(): Promise<void> {
  try {
    try {
      await connectDatabase();
      console.log(CONSOLE_MESSAGES.DB_CONNECTED);
    } catch {
      console.warn(CONSOLE_MESSAGES.DB_UNAVAILABLE);
      console.warn(CONSOLE_MESSAGES.DB_CONFIG_HINT);
    }

    const server = app.listen(env.PORT, () => {
      console.log(CONSOLE_MESSAGES.SERVER_RUNNING(env.PORT));
      console.log(CONSOLE_MESSAGES.SWAGGER_AVAILABLE(env.PORT));
      console.log(CONSOLE_MESSAGES.ENVIRONMENT(env.NODE_ENV));
    });

    /**
     * Entrada: signal: nombre de la señal del sistema operativo (SIGTERM o SIGINT).
     * Proceso: Cierra el servidor HTTP, desconecta la base de datos y termina el proceso.
     * Salida: No retorna valor; finaliza el proceso con código 0.
     */
    const shutdown = async (signal: string) => {
      console.log(CONSOLE_MESSAGES.SERVER_SHUTDOWN(signal));
      server.close(async () => {
        await disconnectDatabase();
        console.log(CONSOLE_MESSAGES.SERVER_CLOSED);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(CONSOLE_MESSAGES.SERVER_START_ERROR, error);
    process.exit(1);
  }
}

bootstrap();
