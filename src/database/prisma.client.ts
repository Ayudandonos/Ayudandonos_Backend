import { PrismaClient } from '@prisma/client';
import { isDevelopment } from '../config/env.config.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// Entrada:
// Ninguna.

// Proceso:
// Establece la conexión activa con la base de datos mediante Prisma.

// Salida:
// Retorna una promesa que se resuelve cuando la conexión está lista.
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

// Entrada:
// Ninguna.

// Proceso:
// Cierra la conexión activa con la base de datos mediante Prisma.

// Salida:
// Retorna una promesa que se resuelve cuando la desconexión finaliza.
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
