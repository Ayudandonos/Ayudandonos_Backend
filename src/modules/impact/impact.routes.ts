import { Router } from 'express';
import { impactController } from './impact.controller.js';

const impactRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Impact
 *   description: Estadisticas publicas de impacto de la plataforma
 */

/**
 * @swagger
 * /impact/stats:
 *   get:
 *     summary: Estadisticas publicas de impacto
 *     tags: [Impact]
 *     responses:
 *       200:
 *         description: Contadores reales de la plataforma
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     verifiedFoundations:
 *                       type: integer
 *                     activeDonors:
 *                       type: integer
 *                     registeredDonations:
 *                       type: integer
 *                     confirmedDeliveryRatePercent:
 *                       type: integer
 *                 errors:
 *                   nullable: true
 */
impactRoutes.get('/stats', impactController.getPublicStats);

export { impactRoutes };
