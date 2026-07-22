import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type { ListUsersQueryDto, UpdateUserData } from './users.dto.js';

export type UserWithFoundation = Prisma.UserGetPayload<{
  include: {
    foundation: {
      include: {
        documents: { select: { type: true } };
      };
    };
  };
}>;

export type UserPublicRecord = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;

const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  phone: true,
  city: true,
  department: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export class UsersRepository {
  /**
   * Entrada: query: parametros de paginacion y filtros opcionales.
   * Proceso: Consulta usuarios paginados sin exponer el hash de contraseña.
   * Salida: Retorna items y total de registros que coinciden con los filtros.
   */
  async findManyPaginated(query: ListUsersQueryDto): Promise<{
    items: UserPublicRecord[];
    total: number;
  }> {
    const where: Prisma.UserWhereInput = {};

    if (query.role !== undefined) {
      where.role = query.role;
    } else {
      // El panel admin solo gestiona donantes y fundaciones.
      where.role = { in: ['USER', 'FOUNDATION'] };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userPublicSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: id: identificador UUID del usuario.
   * Proceso: Busca un usuario por id incluyendo fundacion asociada si existe.
   * Salida: Retorna el usuario con fundacion o null si no existe.
   */
  async findByIdWithFoundation(id: string): Promise<UserWithFoundation | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        foundation: {
          include: {
            documents: { select: { type: true } },
          },
        },
      },
    });
  }

  /**
   * Entrada: id: identificador del usuario; data: campos a actualizar.
   * Proceso: Persiste los cambios del perfil o administracion del usuario.
   * Salida: Retorna el usuario actualizado con su fundacion si aplica.
   */
  async updateById(
    id: string,
    data: UpdateUserData,
  ): Promise<UserWithFoundation> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        foundation: {
          include: {
            documents: { select: { type: true } },
          },
        },
      },
    });
  }

  /**
   * Entrada: id: identificador del usuario a desactivar.
   * Proceso: Marca isActive en false (soft delete).
   * Salida: Retorna el usuario desactivado.
   */
  async softDeactivate(id: string): Promise<UserPublicRecord> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userPublicSelect,
    });
  }

  /**
   * Entrada: id: identificador del usuario a reactivar.
   * Proceso: Marca isActive en true para restaurar el acceso de login.
   * Salida: Retorna el usuario reactivado.
   */
  async softReactivate(id: string): Promise<UserPublicRecord> {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: userPublicSelect,
    });
  }
}

export const usersRepository = new UsersRepository();
