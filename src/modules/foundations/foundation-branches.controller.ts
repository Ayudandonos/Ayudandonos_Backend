import type { Request, Response } from 'express';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { foundationBranchesService } from './foundation-branches.service.js';
import type {
  CreateFoundationBranchInput,
  FoundationBranchIdParamInput,
  UpdateFoundationBranchInput,
} from './foundation-branches.validations.js';

export class FoundationBranchesController {
  /**
   * Entrada: req: peticion autenticada de fundacion; res: respuesta HTTP.
   * Proceso: Delega el listado de sedes propias al servicio.
   * Salida: No retorna valor; responde 200 con arreglo de sedes.
   */
  listMine = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await foundationBranchesService.listMine(user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.BRANCHES_LIST_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con body de sede; res: respuesta HTTP.
   * Proceso: Delega la creacion de sede al servicio.
   * Salida: No retorna valor; responde 201 con sede creada.
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const body = req.body as CreateFoundationBranchInput;
    const data = await foundationBranchesService.create(body, user);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.BRANCHES_CREATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con branchId y body parcial; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de sede al servicio.
   * Salida: No retorna valor; responde 200 con sede actualizada.
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { branchId } = req.params as FoundationBranchIdParamInput;
    const body = req.body as UpdateFoundationBranchInput;
    const data = await foundationBranchesService.update(branchId, body, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.BRANCHES_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con branchId; res: respuesta HTTP.
   * Proceso: Delega la desactivacion de sede al servicio.
   * Salida: No retorna valor; responde 200 con sede inactiva.
   */
  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { branchId } = req.params as FoundationBranchIdParamInput;
    const data = await foundationBranchesService.deactivate(branchId, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.BRANCHES_DEACTIVATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con branchId; res: respuesta HTTP.
   * Proceso: Delega la reactivacion de sede al servicio.
   * Salida: No retorna valor; responde 200 con sede activa.
   */
  activate = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { branchId } = req.params as FoundationBranchIdParamInput;
    const data = await foundationBranchesService.activate(branchId, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.BRANCHES_ACTIVATE_SUCCESS),
    );
  });
}

export const foundationBranchesController = new FoundationBranchesController();
