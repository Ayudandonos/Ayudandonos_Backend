import type { UserRole } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { toPublicFoundationDto } from '../foundations/public-foundation.mapper.js';
import { donationsRepository } from '../donations/donations.repository.js';
import type {
  ListUsersQueryDto,
  UpdateUserData,
  UpdateUserDto,
  PaginatedUsersDto,
  UserDetailResponseDto,
  UserListItemDto,
} from './users.dto.js';
import {
  usersRepository,
  type UserWithFoundation,
} from './users.repository.js';

interface RequesterContext {
  id: string;
  role: string;
}

export class UsersService {
  /**
   * Entrada: query: filtros y paginacion; requester: usuario autenticado que realiza la consulta.
   * Proceso: Valida rol admin y retorna listado paginado de usuarios.
   * Salida: Retorna items y metadatos de paginacion.
   */
  async listUsers(
    query: ListUsersQueryDto,
    requester: RequesterContext,
  ): Promise<{ data: PaginatedUsersDto; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    this.assertIsAdmin(requester);

    const { items, total } = await usersRepository.findManyPaginated(query);
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: items.map((user) => this.toListItem(user)),
      },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: requester: usuario autenticado.
   * Proceso: Obtiene el perfil propio con fundacion y stats de donaciones si aplica.
   * Salida: Retorna el perfil completo del solicitante.
   */
  async getMyProfile(requester: RequesterContext): Promise<UserDetailResponseDto> {
    return this.getUserById(requester.id, requester);
  }

  /**
   * Entrada: id: identificador del usuario; requester: usuario autenticado.
   * Proceso: Permite acceso a admin o al propio usuario; obtiene detalle con fundacion y stats.
   * Salida: Retorna detalle publico del usuario.
   */
  async getUserById(
    id: string,
    requester: RequesterContext,
  ): Promise<UserDetailResponseDto> {
    this.assertIsAdminOrSelf(id, requester);

    const user = await usersRepository.findByIdWithFoundation(id);

    if (!user) {
      throw new AppError(API_MESSAGES.AUTH_USER_NOT_FOUND, 404);
    }

    return this.toDetailResponse(user);
  }

  /**
   * Entrada: requester: usuario autenticado; input: datos de perfil a actualizar.
   * Proceso: Actualiza el perfil del solicitante.
   * Salida: Retorna el perfil actualizado.
   */
  async updateMyProfile(
    requester: RequesterContext,
    input: UpdateUserDto,
  ): Promise<UserDetailResponseDto> {
    return this.updateUser(requester.id, input, requester);
  }

  /**
   * Entrada: id: identificador del usuario; input: datos a actualizar; requester: usuario autenticado.
   * Proceso: Admin puede actualizar perfil y campos administrativos; el usuario sus campos de perfil.
   * Salida: Retorna el usuario actualizado con fundacion y stats si aplica.
   */
  async updateUser(
    id: string,
    input: UpdateUserDto,
    requester: RequesterContext,
  ): Promise<UserDetailResponseDto> {
    this.assertIsAdminOrSelf(id, requester);

    const existingUser = await usersRepository.findByIdWithFoundation(id);

    if (!existingUser) {
      throw new AppError(API_MESSAGES.AUTH_USER_NOT_FOUND, 404);
    }

    const updateData = this.buildUpdateData(input, requester);

    const updatedUser = await usersRepository.updateById(id, updateData);

    return this.toDetailResponse(updatedUser);
  }

  /**
   * Entrada: id: identificador del usuario; requester: administrador autenticado.
   * Proceso: Desactiva la cuenta (soft delete); impide que un admin se desactive a si mismo.
   * Salida: Retorna el usuario desactivado en formato de listado.
   */
  async deactivateUser(
    id: string,
    requester: RequesterContext,
  ): Promise<UserListItemDto> {
    this.assertIsAdmin(requester);

    if (requester.id === id) {
      throw new AppError(API_MESSAGES.USERS_CANNOT_DEACTIVATE_SELF, 400);
    }

    const existingUser = await usersRepository.findByIdWithFoundation(id);

    if (!existingUser) {
      throw new AppError(API_MESSAGES.AUTH_USER_NOT_FOUND, 404);
    }

    if (!existingUser.isActive) {
      throw new AppError(API_MESSAGES.USERS_ALREADY_INACTIVE, 400);
    }

    const deactivatedUser = await usersRepository.softDeactivate(id);

    return this.toListItem(deactivatedUser);
  }

  /**
   * Entrada: requester: usuario autenticado.
   * Proceso: Verifica que el rol sea ADMIN.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertIsAdmin(requester: RequesterContext): void {
    if (requester.role !== 'ADMIN') {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }
  }

  /**
   * Entrada: targetUserId: id del recurso; requester: usuario autenticado.
   * Proceso: Permite acceso si es admin o si el id coincide con el solicitante.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertIsAdminOrSelf(
    targetUserId: string,
    requester: RequesterContext,
  ): void {
    if (requester.role === 'ADMIN' || requester.id === targetUserId) {
      return;
    }

    throw new AppError(API_MESSAGES.USERS_CANNOT_ACCESS_OTHERS, 403);
  }

  /**
   * Entrada: input: datos del body; requester: usuario que ejecuta la actualizacion.
   * Proceso: Filtra campos permitidos segun rol (admin vs self).
   * Salida: Retorna objeto listo para el repository.
   */
  private buildUpdateData(
    input: UpdateUserDto,
    requester: RequesterContext,
  ): UpdateUserData {
    if (requester.role === 'ADMIN') {
      return input;
    }

    if (input.isActive !== undefined || input.role !== undefined) {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }

    return {
      fullName: input.fullName,
      phone: input.phone,
      city: input.city,
      department: input.department,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
    };
  }

  /**
   * Entrada: user: entidad de usuario de Prisma.
   * Proceso: Mapea a DTO de item de listado sin datos sensibles.
   * Salida: Retorna UserListItemDto.
   */
  private toListItem(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    phone: string | null;
    city: string | null;
    department: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  }): UserListItemDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      city: user.city,
      department: user.department,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Entrada: user: usuario con fundacion opcional.
   * Proceso: Mapea a respuesta de detalle e incluye stats de donaciones para rol USER.
   * Salida: Retorna UserDetailResponseDto.
   */
  private async toDetailResponse(
    user: UserWithFoundation,
  ): Promise<UserDetailResponseDto> {
    const donationStats =
      user.role === 'USER'
        ? await donationsRepository.getDonorStats(user.id)
        : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        city: user.city,
        department: user.department,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      foundation:
        user.role === 'FOUNDATION' && user.foundation
          ? toPublicFoundationDto(user.foundation)
          : null,
      donationStats,
    };
  }
}

export const usersService = new UsersService();
