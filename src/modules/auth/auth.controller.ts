import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { authService } from './auth.service.js';
import type {
  LoginInput,
  RegisterFoundationInput,
  RegisterUserInput,
} from './auth.validations.js';

export class AuthController {
  /**
   * Entrada: req: peticion HTTP con datos de registro de usuario; res: respuesta HTTP.
   * Proceso: Delega el registro de donante al servicio de autenticacion.
   * Salida: No retorna valor; responde 201 con token y usuario creado.
   */
  registerUser = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterUserInput;
    const data = await authService.registerUser(body);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_REGISTER_USER_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion HTTP con datos de registro de fundacion; res: respuesta HTTP.
   * Proceso: Delega el registro de fundacion al servicio de autenticacion.
   * Salida: No retorna valor; responde 201 con token, usuario y fundacion creados.
   */
  registerFoundation = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterFoundationInput;
    const data = await authService.registerFoundation(body);

    res.status(201).json(
      ApiResponseBuilder.success(
        data,
        API_MESSAGES.AUTH_REGISTER_FOUNDATION_SUCCESS,
      ),
    );
  });

  /**
   * Entrada: req: peticion HTTP con credenciales; res: respuesta HTTP.
   * Proceso: Delega la autenticacion al servicio de autenticacion.
   * Salida: No retorna valor; responde 200 con token y usuario autenticado.
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginInput;
    const data = await authService.login(body);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_LOGIN_SUCCESS),
    );
  });

  /**
   * Entrada: _req: peticion HTTP autenticada; res: respuesta HTTP.
   * Proceso: Delega el cierre de sesion stateless al servicio de autenticacion.
   * Salida: No retorna valor; responde 200 confirmando cierre de sesion.
   */
  logout = asyncHandler(async (_req: Request, res: Response) => {
    await authService.logout();

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.AUTH_LOGOUT_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion HTTP autenticada con req.user; res: respuesta HTTP.
   * Proceso: Delega la obtencion del perfil autenticado al servicio de autenticacion.
   * Salida: No retorna valor; responde 200 con usuario y fundacion si aplica.
   */
  me = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await authService.getMe(user.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_ME_SUCCESS),
    );
  });
}

export const authController = new AuthController();
