import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { adminService } from './admin.service.js';
import type { AdminDashboardQueryInput } from './admin.validations.js';

export class AdminController {
  /**
   * Entrada: req: peticion autenticada ADMIN con query opcional; res: respuesta HTTP.
   * Proceso: Delega la agregacion del panel administrativo al servicio admin.
   * Salida: No retorna valor; responde 200 con KPIs y listas del dashboard.
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminDashboardQueryInput;
    const data = await adminService.getDashboard(query);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.ADMIN_DASHBOARD_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada ADMIN; res: respuesta HTTP.
   * Proceso: Delega la agregacion de reportes y series al servicio admin.
   * Salida: No retorna valor; responde 200 con resumen y series para graficos.
   */
  getReports = asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getReports();

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.ADMIN_REPORTS_SUCCESS),
    );
  });
}

export const adminController = new AdminController();
