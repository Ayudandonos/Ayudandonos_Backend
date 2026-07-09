import type { UserRole } from '@prisma/client';
import type { PublicFoundationDto, PublicUserDto } from '../auth/auth.dto.js';

export interface UserDetailDto extends PublicUserDto {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetailResponseDto {
  user: UserDetailDto;
  foundation: PublicFoundationDto | null;
}

export interface UserListItemDto extends PublicUserDto {
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedUsersDto {
  items: UserListItemDto[];
}

export interface UpdateUserDto {
  fullName?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface ListUsersQueryDto {
  page: number;
  limit: number;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserData {
  fullName?: string;
  isActive?: boolean;
  role?: UserRole;
}
