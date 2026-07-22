import { Router } from 'express';
import { impactController } from './impact.controller.js';

const impactRoutes = Router();

/**
 * @swagger
 * /impact/stats:
 *   get:
 *     summary: Estadisticas publicas de impacto
 *     tags: [Impact]
 *     responses:
 *       200:
 *         description: Contadores reales de la plataforma
 */
impactRoutes.get('/stats', impactController.getPublicStats);

export { impactRoutes };
