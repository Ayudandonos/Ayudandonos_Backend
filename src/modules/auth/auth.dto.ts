/**
 * Auth Module — Skeleton (Fase 1)
 * Autenticación JWT. Implementación completa en Fase 2.
 */

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  role: 'donor' | 'foundation' | 'admin';
}

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface TokenPayloadDto {
  sub: string;
  email: string;
  role: string;
}
