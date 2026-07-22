import { spawnSync } from 'node:child_process';
import process from 'node:process';

/**
 * Entrada: command: binario; args: argumentos CLI.
 * Proceso: Ejecuta un comando sincrono y aborta el build si falla.
 * Salida: No retorna valor; finaliza el proceso con codigo distinto de 0 si hay error.
 */
function run(command, args) {
  console.log(`\n[vercel-build] > ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(`[vercel-build] Fallo: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

/**
 * Entrada: Ninguna (usa env del build de Vercel).
 * Proceso: Genera Prisma Client, aplica migraciones a la BD y compila TypeScript.
 * Salida: Termina con exito (0) o aborta el despliegue si migrate/build fallan.
 */
function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      '[vercel-build] DATABASE_URL no esta definida. Configurala en Vercel → Settings → Environment Variables (Production y Preview).',
    );
    process.exit(1);
  }

  console.log('[vercel-build] Iniciando generate + migrate deploy + build...');

  run('npx', ['prisma', 'generate']);
  run('npx', ['prisma', 'migrate', 'deploy']);

  console.log('[vercel-build] Ejecutando seed (admins + dataset demo)...');
  run('npx', ['prisma', 'db', 'seed']);

  run('npx', ['tsc']);
  console.log('[vercel-build] Completado.');
}

main();
