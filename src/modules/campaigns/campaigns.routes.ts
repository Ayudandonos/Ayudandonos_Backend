import { Router } from 'express';
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from '../../middlewares/auth.middleware.js';
import { requireFoundationOperational } from '../../middlewares/foundation-access.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { campaignsController } from './campaigns.controller.js';
import {
  campaignIdParamSchema,
  createCampaignSchema,
  listCampaignsQuerySchema,
  updateCampaignSchema,
} from './campaigns.validations.js';

const campaignsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Gestion de campanas de recoleccion
 */

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Listar campanas publicadas (paginado)
 *     tags: [Campaigns]
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 */
campaignsRoutes.get(
  '/',
  validate(listCampaignsQuerySchema, 'query'),
  campaignsController.findAll,
);

/**
 * @swagger
 * /campaigns/me:
 *   get:
 *     summary: Listar campanas propias de la fundacion
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, FINISHED, CANCELLED]
 *     responses:
 *       200:
 *         description: Listado propio obtenido correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Fundacion no operativa
 */
campaignsRoutes.get(
  '/me',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(listCampaignsQuerySchema, 'query'),
  campaignsController.findMine,
);

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     summary: Obtener campana por id
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Campana encontrada
 *       403:
 *         description: Campana no publica
 *       404:
 *         description: Campana no encontrada
 */
campaignsRoutes.get(
  '/:id',
  optionalAuthenticate,
  validate(campaignIdParamSchema, 'params'),
  campaignsController.findById,
);

/**
 * @swagger
 * /campaigns:
 *   post:
 *     summary: Crear campana
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Campana creada
 *       400:
 *         description: Validacion fallida
 *       403:
 *         description: Fundacion no operativa
 */
campaignsRoutes.post(
  '/',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(createCampaignSchema),
  campaignsController.create,
);

/**
 * @swagger
 * /campaigns/{id}:
 *   patch:
 *     summary: Actualizar campana propia
 *     tags: [Campaigns]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, FINISHED, CANCELLED]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Campana actualizada
 *       403:
 *         description: Sin permiso sobre la campana
 *       404:
 *         description: Campana no encontrada
 */
campaignsRoutes.patch(
  '/:id',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(campaignIdParamSchema, 'params'),
  validate(updateCampaignSchema),
  campaignsController.update,
);

/**
 * @swagger
 * /campaigns/{id}:
 *   delete:
 *     summary: Eliminar campana propia (soft delete)
 *     tags: [Campaigns]
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
 *         description: Campana eliminada
 *       403:
 *         description: Sin permiso sobre la campana
 *       404:
 *         description: Campana no encontrada
 */
campaignsRoutes.delete(
  '/:id',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(campaignIdParamSchema, 'params'),
  campaignsController.remove,
);

export { campaignsRoutes };
