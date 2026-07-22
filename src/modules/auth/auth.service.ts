import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { hashUtil } from '../../utils/hash.util.js';
import { jwtUtil } from '../../utils/jwt.util.js';
import type {
  AuthTokenResponseDto,
  LoginDto,
  MeResponseDto,
  PublicUserDto,
  RegisterFoundationDto,
  RegisterUserDto,
} from './auth.dto.js';
import { toPublicFoundationDto } from '../foundations/public-foundation.mapper.js';
import {
  authRepository,
  type UserWithFoundation,
} from './auth.repository.js';

export class AuthService {
  /**
   * Entrada: input: credenciales de registro del donante.
   * Proceso: Valida unicidad del email, hashea la contraseña, crea usuario con rol USER y genera JWT.
   * Salida: Retorna token de acceso y datos públicos del usuario registrado.
   */
  async registerUser(input: RegisterUserDto): Promise<AuthTokenResponseDto> {
    await this.ensureEmailIsAvailable(input.email);

    const passwordHash = await hashUtil.hash(input.password);

    try {
      const user = await authRepository.createUser({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: 'USER',
      });

      return this.buildAuthResponse({ ...user, foundation: null });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  /**
   * Entrada: input: credenciales y datos de la fundación a registrar.
   * Proceso: Valida unicidad del email, hashea la contraseña y crea usuario + fundación en transacción.
   * Salida: Retorna token de acceso, usuario y fundación creados.
   */
  async registerFoundation(
    input: RegisterFoundationDto,
  ): Promise<AuthTokenResponseDto> {
    await this.ensureEmailIsAvailable(input.email);

    const passwordHash = await hashUtil.hash(input.password);

    try {
      const userWithFoundation = await authRepository.createUserWithFoundation({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        foundationName: input.foundationName,
        description: input.description,
      });

      return this.buildAuthResponse(userWithFoundation);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  /**
   * Entrada: input: credenciales de inicio de sesión.
   * Proceso: Busca usuario por email, valida contraseña y estado activo; genera JWT para cualquier rol.
   * Salida: Retorna token de acceso y datos públicos del usuario autenticado.
   */
  async login(input: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await authRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError(API_MESSAGES.AUTH_INVALID_CREDENTIALS, 401);
    }

    const isPasswordValid = await hashUtil.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError(API_MESSAGES.AUTH_INVALID_CREDENTIALS, 401);
    }

    this.ensureUserIsActive(user);

    return this.buildAuthResponse(user);
  }

  /**
   * Entrada: Ninguna (logout stateless basado en JWT).
   * Proceso: Confirma el cierre de sesión; la invalidación del token ocurre en el cliente.
   * Salida: Retorna void al completar la operación lógica de logout.
   */
  async logout(): Promise<void> {
    return;
  }

  /**
   * Entrada: userId: identificador del usuario autenticado.
   * Proceso: Obtiene el perfil del usuario y su fundación si el rol es FOUNDATION.
   * Salida: Retorna datos públicos del usuario y fundación cuando corresponda.
   */
  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(API_MESSAGES.AUTH_USER_NOT_FOUND, 404);
    }

    this.ensureUserIsActive(user);

    return {
      user: this.toPublicUser(user),
      foundation:
        user.role === 'FOUNDATION' && user.foundation
          ? toPublicFoundationDto(user.foundation)
          : null,
    };
  }

  /**
   * Entrada: email: correo a validar antes de registrar.
   * Proceso: Verifica que no exista otro usuario con el mismo email.
   * Salida: Retorna void o lanza AppError 409 si el email ya está registrado.
   */
  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await authRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError(API_MESSAGES.AUTH_EMAIL_ALREADY_EXISTS, 409);
    }
  }

  /**
   * Entrada: user: entidad de usuario con estado activo.
   * Proceso: Verifica que la cuenta del usuario esté habilitada.
   * Salida: Retorna void o lanza AppError 403 si la cuenta está desactivada.
   */
  private ensureUserIsActive(user: UserWithFoundation): void {
    if (!user.isActive) {
      throw new AppError(API_MESSAGES.AUTH_USER_INACTIVE, 403);
    }
  }

  /**
   * Entrada: user: usuario con o sin fundación asociada.
   * Proceso: Genera JWT y construye la respuesta de autenticación sin datos sensibles.
   * Salida: Retorna token y datos públicos del usuario (y fundación si aplica).
   */
  private buildAuthResponse(
    user: UserWithFoundation | (UserWithFoundation & { foundation?: null }),
  ): AuthTokenResponseDto {
    const accessToken = jwtUtil.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthTokenResponseDto = {
      accessToken,
      user: this.toPublicUser(user),
    };

    if (user.role === 'FOUNDATION' && user.foundation) {
      response.foundation = toPublicFoundationDto(user.foundation);
    }

    return response;
  }

  /**
   * Entrada: user: entidad de usuario de Prisma.
   * Proceso: Mapea el usuario a un DTO público excluyendo contraseña y campos internos.
   * Salida: Retorna el DTO público del usuario.
   */
  private toPublicUser(user: UserWithFoundation): PublicUserDto {
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
    };
  }

  /**
   * Entrada: error: error capturado durante operaciones de persistencia.
   * Proceso: Traduce errores de Prisma a AppError con códigos HTTP apropiados.
   * Salida: Retorna void o relanza AppError; nunca retorna en caso de error no controlado.
   */
  private handlePersistenceError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(API_MESSAGES.AUTH_EMAIL_ALREADY_EXISTS, 409);
    }

    throw error;
  }
}

export const authService = new AuthService();
