import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type { CreateFoundationData, CreateUserData } from './auth.dto.js';

const userWithFoundationInclude = {
  foundation: {
    include: {
      documents: { select: { type: true } },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithFoundation = Prisma.UserGetPayload<{
  include: typeof userWithFoundationInclude;
}>;

export class AuthRepository {
  /**
   * Entrada: email: correo electronico a buscar.
   * Proceso: Consulta un usuario por email incluyendo fundacion y documentos asociados.
   * Salida: Retorna el usuario con fundacion o null si no existe.
   */
  async findByEmail(email: string): Promise<UserWithFoundation | null> {
    return prisma.user.findUnique({
      where: { email },
      include: userWithFoundationInclude,
    });
  }

  /**
   * Entrada: id: identificador UUID del usuario.
   * Proceso: Consulta un usuario por id incluyendo fundacion y documentos asociados.
   * Salida: Retorna el usuario con fundacion o null si no existe.
   */
  async findById(id: string): Promise<UserWithFoundation | null> {
    return prisma.user.findUnique({
      where: { id },
      include: userWithFoundationInclude,
    });
  }

  /**
   * Entrada: data: datos del usuario a persistir con rol predefinido.
   * Proceso: Crea un registro de usuario en la base de datos.
   * Salida: Retorna el usuario creado sin relaciones adicionales.
   */
  async createUser(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
    });
  }

  /**
   * Entrada: data: datos del usuario y de la fundacion a registrar.
   * Proceso: Crea usuario y fundacion en una transaccion atomica; revierte si alguna operacion falla.
   * Salida: Retorna el usuario creado con su fundacion asociada sin documentos.
   */
  async createUserWithFoundation(data: CreateFoundationData): Promise<UserWithFoundation> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          role: 'FOUNDATION',
        },
      });

      const foundation = await tx.foundation.create({
        data: {
          userId: user.id,
          name: data.foundationName,
          description: data.description ?? null,
          institutionalEmail: data.email,
          legalRepresentativeName: data.fullName,
          status: 'PENDING',
        },
        include: {
          documents: { select: { type: true } },
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
