import type { UserRole } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterFoundationDto {
  email: string;
  password: string;
  fullName: string;
  foundationName: string;
  description?: string;
}

export interface PublicUserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface PublicFoundationDto {
  id: string;
  name: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  logoUrl: string | null;
  category: string | null;
  city: string | null;
  description: string | null;
  isProfileComplete: boolean;
  hasRequiredDocuments: boolean;
}

export interface AuthTokenResponseDto {
  accessToken: string;
  user: PublicUserDto;
  foundation?: PublicFoundationDto;
}

export interface MeResponseDto {
  user: PublicUserDto;
  foundation: PublicFoundationDto | null;
}

export interface TokenPayloadDto {
  sub: string;
  email: string;
  role: UserRole;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
}

export interface CreateFoundationData {
  email: string;
  passwordHash: string;
  fullName: string;
  foundationName: string;
  description?: string;
}
