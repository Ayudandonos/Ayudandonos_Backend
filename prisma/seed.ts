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

// Entrada:
// plainText: contraseña en texto plano.

// Proceso:
// Genera hash bcrypt con las mismas rondas de sal que el módulo de autenticación.

// Salida:
// Retorna el hash listo para persistir en base de datos.
async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

// Entrada:
// admin: datos del administrador a sembrar; passwordHash: hash de la contraseña.

// Proceso:
// Crea o actualiza un usuario ADMIN por email (idempotente).

// Salida:
// Retorna el usuario persistido.
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

// Entrada:
// Ninguna.

// Proceso:
// Valida SEED_ADMIN_PASSWORD, hashea una vez y crea o actualiza los administradores.

// Salida:
// Retorna void al completar el seed.
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
}

main()
  .catch((error: unknown) => {
    console.error('[SEED] Error al sembrar administradores:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
