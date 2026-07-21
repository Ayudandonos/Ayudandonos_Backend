import { Router } from 'express';
import {
  authenticate,
  authorize,
} from '../../middlewares/auth.middleware.js';
import { requireFoundationOperational } from '../../middlewares/foundation-access.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { needsController } from './needs.controller.js';
import {
  createNeedSchema,
  listNeedsQuerySchema,
  needIdParamSchema,
  updateNeedSchema,
} from './needs.validations.js';

const needsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Needs
 *   description: Gestion de necesidades de campanas
 */

/**
 * @swagger
 * /needs:
 *   get:
 *     summary: Listar necesidades de una campana (paginado)
 *     tags: [Needs]
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 *       404:
 *         description: Campana no encontrada
 */
needsRoutes.get(
  '/',
  validate(listNeedsQuerySchema, 'query'),
  needsController.findAll,
);

/**
 * @swagger
 * /needs/{id}:
 *   get:
 *     summary: Obtener necesidad por id
 *     tags: [Needs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Necesidad encontrada
 *       404:
 *         description: Necesidad o campana no encontrada
 */
needsRoutes.get(
  '/:id',
  validate(needIdParamSchema, 'params'),
  needsController.findById,
);

/**
 * @swagger
 * /needs:
 *   post:
 *     summary: Crear necesidad en campana propia
 *     tags: [Needs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaignId, name, quantity, unit]
 *             properties:
 *               campaignId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unit:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       201:
 *         description: Necesidad creada
 *       403:
 *         description: Campana no pertenece a la fundacion
 *       404:
 *         description: Campana no encontrada
 */
needsRoutes.post(
  '/',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(createNeedSchema),
  needsController.create,
);

/**
 * @swagger
 * /needs/{id}:
 *   patch:
 *     summary: Actualizar necesidad propia
 *     tags: [Needs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unit:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       200:
 *         description: Necesidad actualizada
 *       403:
 *         description: Sin permiso sobre la necesidad
 *       404:
 *         description: Necesidad no encontrada
 */
needsRoutes.patch(
  '/:id',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(needIdParamSchema, 'params'),
  validate(updateNeedSchema),
  needsController.update,
);

/**
 * @swagger
 * /needs/{id}:
 *   delete:
 *     summary: Eliminar necesidad propia (soft delete)
 *     tags: [Needs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Necesidad eliminada
 *       400:
 *         description: Necesidad con donaciones asociadas
 *       403:
 *         description: Sin permiso sobre la necesidad
 *       404:
 *         description: Necesidad no encontrada
 */
needsRoutes.delete(
  '/:id',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(needIdParamSchema, 'params'),
  needsController.remove,
);

export { needsRoutes };
