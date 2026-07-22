import type { UserRole } from '@prisma/client';
import type { PublicFoundationDto, PublicUserDto } from '../auth/auth.dto.js';
import type { DonorDonationStatsDto } from '../donations/donations.dto.js';

export interface UserDetailDto extends PublicUserDto {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetailResponseDto {
  user: UserDetailDto;
  foundation: PublicFoundationDto | null;
  donationStats: DonorDonationStatsDto | null;
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
  phone?: string | null;
  city?: string | null;
  department?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  role?: UserRole;
}

export interface ListUsersQueryDto {
  page: number;
  limit: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string | null;
  city?: string | null;
  department?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  role?: UserRole;
}
