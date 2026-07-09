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
  registerUser = asyncHandler(async (req: Request, res: Response) => {
    // Entrada:
    // req: petición HTTP con datos de registro de usuario; res: respuesta HTTP.

    // Proceso:
    // Delega el registro de donante al servicio de autenticación.

    // Salida:
    // No retorna valor; responde 201 con token y usuario creado.
    const body = req.body as RegisterUserInput;
    const data = await authService.registerUser(body);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_REGISTER_USER_SUCCESS),
    );
  });

  registerFoundation = asyncHandler(async (req: Request, res: Response) => {
    // Entrada:
    // req: petición HTTP con datos de registro de fundación; res: respuesta HTTP.

    // Proceso:
    // Delega el registro de fundación al servicio de autenticación.

    // Salida:
    // No retorna valor; responde 201 con token, usuario y fundación creados.
    const body = req.body as RegisterFoundationInput;
    const data = await authService.registerFoundation(body);

    res.status(201).json(
      ApiResponseBuilder.success(
        data,
        API_MESSAGES.AUTH_REGISTER_FOUNDATION_SUCCESS,
      ),
    );
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    // Entrada:
    // req: petición HTTP con credenciales; res: respuesta HTTP.

    // Proceso:
    // Delega la autenticación al servicio de autenticación.

    // Salida:
    // No retorna valor; responde 200 con token y usuario autenticado.
    const body = req.body as LoginInput;
    const data = await authService.login(body);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_LOGIN_SUCCESS),
    );
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    // Entrada:
    // _req: petición HTTP autenticada; res: respuesta HTTP.

    // Proceso:
    // Delega el cierre de sesión stateless al servicio de autenticación.

    // Salida:
    // No retorna valor; responde 200 confirmando cierre de sesión.
    await authService.logout();

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.AUTH_LOGOUT_SUCCESS),
    );
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    // Entrada:
    // req: petición HTTP autenticada con req.user; res: respuesta HTTP.

    // Proceso:
    // Delega la obtención del perfil autenticado al servicio de autenticación.

    // Salida:
    // No retorna valor; responde 200 con usuario y fundación si aplica.
    const { user } = req as AuthenticatedRequest;
    const data = await authService.getMe(user.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.AUTH_ME_SUCCESS),
    );
  });
}

export const authController = new AuthController();
