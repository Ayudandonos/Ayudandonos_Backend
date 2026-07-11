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
}

export const usersController = new UsersController();
