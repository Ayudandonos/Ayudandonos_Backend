import { Router } from 'express';
import { statisticsController } from './statistics.controller.js';

const statisticsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Estadisticas legacy (deprecado; usar /admin/reports o /impact/stats)
 */

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Endpoint legacy de estadisticas (no implementado)
 *     tags: [Statistics]
 *     deprecated: true
 *     description: Usar GET /admin/reports (ADMIN) o GET /impact/stats (publico).
 *     responses:
 *       501:
 *         description: Endpoint en desarrollo; modulo reemplazado por Admin e Impact
 */
statisticsRoutes.get('/', statisticsController.findAll);

export { statisticsRoutes };
