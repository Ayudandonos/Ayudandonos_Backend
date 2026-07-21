import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { adminController } from './admin.controller.js';
import { adminDashboardQuerySchema } from './admin.validations.js';

const adminRoutes = Router();

adminRoutes.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Panel administrativo
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Obtener datos agregados del panel administrativo
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latestNeedsLimit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: featuredCampaignsLimit
 *         schema:
 *           type: integer
 *           default: 3
 *           maximum: 10
 *     responses:
 *       200:
 *         description: Panel administrativo obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 */
adminRoutes.get(
  '/dashboard',
  validate(adminDashboardQuerySchema, 'query'),
  adminController.getDashboard,
);

export { adminRoutes };
