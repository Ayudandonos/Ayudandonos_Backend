import type { Foundation, User, UserRole } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type { CreateFoundationData, CreateUserData } from './auth.dto.js';

export type UserWithFoundation = User & { foundation: Foundation | null };

export class AuthRepository {
  // Entrada:
  // email: correo electrónico a buscar.

  // Proceso:
  // Consulta un usuario por email incluyendo su fundación asociada si existe.

  // Salida:
  // Retorna el usuario con fundación o null si no existe.
  async findByEmail(email: string): Promise<UserWithFoundation | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { foundation: true },
    });
  }

  // Entrada:
  // id: identificador UUID del usuario.

  // Proceso:
  // Consulta un usuario por id incluyendo su fundación asociada si existe.

  // Salida:
  // Retorna el usuario con fundación o null si no existe.
  async findById(id: string): Promise<UserWithFoundation | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { foundation: true },
    });
  }

  // Entrada:
  // data: datos del usuario a persistir con rol predefinido.

  // Proceso:
  // Crea un registro de usuario en la base de datos.

  // Salida:
  // Retorna el usuario creado sin relaciones adicionales.
  async createUser(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
    });
  }

  // Entrada:
  // data: datos del usuario y de la fundación a registrar.

  // Proceso:
  // Crea usuario y fundación en una transacción atómica; revierte si alguna operación falla.

  // Salida:
  // Retorna el usuario creado con su fundación asociada.
  async createUserWithFoundation(
    data: CreateFoundationData,
  ): Promise<UserWithFoundation> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          role: 'FOUNDATION' satisfies UserRole,
        },
      });

      const foundation = await tx.foundation.create({
        data: {
          userId: user.id,
          name: data.foundationName,
          description: data.description ?? null,
        },
      });

      return {
        ...user,
        foundation,
      };
    });
  }
}

export const authRepository = new AuthRepository();
