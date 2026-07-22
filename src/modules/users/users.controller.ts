import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { usersService } from './users.service.js';
import type {
  ListUsersQueryInput,
  UpdateUserInput,
  UserIdParamInput,
} from './users.validations.js';

export class UsersController {
  /**
   * Entrada: req: peticion con query de paginacion; res: respuesta HTTP.
   * Proceso: Delega el listado paginado al servicio de usuarios.
   * Salida: No retorna valor; responde 200 con listado y meta de paginacion.
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const query = req.query as unknown as ListUsersQueryInput;
    const result = await usersService.listUsers(query, user);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.USERS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada; res: respuesta HTTP.
   * Proceso: Delega la obtencion del perfil propio al servicio.
   * Salida: No retorna valor; responde 200 con perfil completo.
   */
  findMe = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await usersService.getMyProfile(user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_PROFILE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con body de perfil; res: respuesta HTTP.
   * Proceso: Delega la actualizacion del perfil propio al servicio.
   * Salida: No retorna valor; responde 200 con perfil actualizado.
   */
  updateMe = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const body = req.body as UpdateUserInput;
    const data = await usersService.updateMyProfile(user, body);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id en params; res: respuesta HTTP.
   * Proceso: Delega la obtencion de detalle al servicio de usuarios.
   * Salida: No retorna valor; responde 200 con detalle del usuario.
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as UserIdParamInput;
    const data = await usersService.getUserById(id, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de actualizacion; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de perfil al servicio de usuarios.
   * Salida: No retorna valor; responde 200 con usuario actualizado.
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as UserIdParamInput;
    const body = req.body as UpdateUserInput;
    const data = await usersService.updateUser(id, body, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id del usuario a desactivar; res: respuesta HTTP.
   * Proceso: Delega la desactivacion (soft delete) al servicio de usuarios.
   * Salida: No retorna valor; responde 200 con usuario desactivado.
   */
  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as UserIdParamInput;
    const data = await usersService.deactivateUser(id, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_DEACTIVATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id del usuario a reactivar; res: respuesta HTTP.
   * Proceso: Delega la reactivacion de acceso de login al servicio de usuarios.
   * Salida: No retorna valor; responde 200 con usuario reactivado.
   */
  reactivate = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as UserIdParamInput;
    const data = await usersService.reactivateUser(id, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.USERS_REACTIVATE_SUCCESS),
    );
  });
}

export const usersController = new UsersController();
