import { spawnSync } from 'node:child_process';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Entrada: Ninguna.
 * Proceso: Ejecuta prisma generate con reintentos ante EPERM en Windows (dev server activo).
 * Salida: Termina con codigo 0 si genera el cliente; 1 si falla tras reintentos.
 */
function sleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

let lastStatus = 1;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync('prisma', ['generate'], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.status === 0) {
    process.exit(0);
  }

  lastStatus = result.status ?? 1;

  if (attempt < MAX_ATTEMPTS) {
    console.warn(
      `prisma generate fallo (intento ${attempt}/${MAX_ATTEMPTS}). Reintento en ${RETRY_DELAY_MS}ms. En Windows, detenga "npm run dev" si el error es EPERM.`,
    );
    sleep(RETRY_DELAY_MS);
  }
}

console.error(
  'prisma generate no pudo completarse. Cierre el servidor de desarrollo y vuelva a ejecutar npm run build.',
);
process.exit(lastStatus);
