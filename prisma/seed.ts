import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 12;

const prisma = new PrismaClient();

interface AdminSeedUser {
  email: string;
  fullName: string;
}

const ADMIN_USERS: AdminSeedUser[] = [
  {
    email: 'apoyo_ud@fesc.edu.co',
    fullName: 'Diego Alexander Rincon Casarubia',
  },
  {
    email: 'tecnico_ud@fesc.edu.co',
    fullName: 'Erick Sebastian Perez Carvajal',
  },
];

/** Administrador local para pruebas de login en desarrollo (panel admin). */
const DEV_TEST_ADMIN: AdminSeedUser = {
  email: 'admin@gmail.com',
  fullName: 'Administrador de prueba',
};

const DEV_TEST_ADMIN_DEFAULT_PASSWORD = 'dmin12345';

/**
 * Entrada: plainText: contraseña en texto plano.
 * Proceso: Genera hash bcrypt con las mismas rondas de sal que el modulo de autenticacion.
 * Salida: Retorna el hash listo para persistir en base de datos.
 */
async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Entrada: admin: datos del administrador a sembrar; passwordHash: hash de la contraseña.
 * Proceso: Crea o actualiza un usuario ADMIN por email (idempotente).
 * Salida: Retorna el usuario persistido.
 */
async function upsertAdmin(admin: AdminSeedUser, passwordHash: string) {
  return prisma.user.upsert({
    where: { email: admin.email },
    update: {
      fullName: admin.fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: admin.email,
      fullName: admin.fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
}

/**
 * Entrada: Ninguna.
 * Proceso: Valida SEED_ADMIN_PASSWORD, hashea una vez y crea o actualiza los administradores.
 * Salida: No retorna valor al completar el seed.
 */
async function main(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      'SEED_ADMIN_PASSWORD debe estar definida en .env y tener al menos 8 caracteres.',
    );
  }

  const passwordHash = await hashPassword(password);

  for (const admin of ADMIN_USERS) {
    const user = await upsertAdmin(admin, passwordHash);
    console.log(`[SEED] Admin listo: ${user.fullName} <${user.email}>`);
  }

  if (process.env.NODE_ENV !== 'production') {
    const devPassword =
      process.env.SEED_DEV_ADMIN_PASSWORD?.trim() || DEV_TEST_ADMIN_DEFAULT_PASSWORD;

    if (devPassword.length < 8) {
      throw new Error(
        'SEED_DEV_ADMIN_PASSWORD debe tener al menos 8 caracteres cuando se define.',
      );
    }

    const devPasswordHash = await hashPassword(devPassword);
    const devUser = await upsertAdmin(DEV_TEST_ADMIN, devPasswordHash);
    console.log(`[SEED] Admin de prueba (dev): ${devUser.fullName} <${devUser.email}>`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('[SEED] Error al sembrar administradores:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
