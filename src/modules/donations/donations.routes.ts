import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { donationsController } from './donations.controller.js';
import {
  createDonationSchema,
  createMessageSchema,
  donationIdParamSchema,
  listDonationsQuerySchema,
  listMessagesQuerySchema,
  updateDonationStatusSchema,
} from './donations.validations.js';

const donationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Compromisos de donacion, recepcion e inventario trazable
 */

/**
 * @swagger
 * /donations:
 *   post:
 *     summary: Crear compromiso de donacion
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [needId, quantity]
 *             properties:
 *               needId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *               estimatedDeliveryAt:
 *                 type: string
 *                 format: date-time
 *               initialMessage:
 *                 type: string
 *                 description: Primer mensaje al chat de la donacion
 *     responses:
 *       201:
 *         description: Donacion creada
 *       400:
 *         description: Validacion o necesidad no disponible
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 */
donationsRoutes.post(
  '/',
  authenticate,
  authorize('USER'),
  validate(createDonationSchema),
  donationsController.create,
);

/**
 * @swagger
 * /donations/me:
 *   get:
 *     summary: Listar donaciones del donante autenticado
 *     tags: [Donations]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMMITTED, RECEIVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 *       401:
 *         description: No autenticado
 */
donationsRoutes.get(
  '/me',
  authenticate,
  authorize('USER'),
  validate(listDonationsQuerySchema, 'query'),
  donationsController.findMine,
);

/**
 * @swagger
 * /donations/{id}/status:
 *   patch:
 *     summary: Actualizar estado de la donacion
 *     tags: [Donations]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [COMMITTED, RECEIVED, CANCELLED]
 *               receivedQuantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Cantidad recibida (solo al confirmar RECEIVED)
 *               receptionNotes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Transicion invalida
 *       403:
 *         description: Sin permiso
 */
donationsRoutes.patch(
  '/:id/status',
  authenticate,
  validate(donationIdParamSchema, 'params'),
  validate(updateDonationStatusSchema),
  donationsController.updateStatus,
);

/**
 * @swagger
 * /donations/{id}/messages:
 *   get:
 *     summary: Listar mensajes de la conversacion de la donacion
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Mensajes obtenidos
 *       403:
 *         description: No participante
 */
donationsRoutes.get(
  '/:id/messages',
  authenticate,
  validate(donationIdParamSchema, 'params'),
  validate(listMessagesQuerySchema, 'query'),
  donationsController.listMessages,
);

/**
 * @swagger
 * /donations/{id}/messages:
 *   post:
 *     summary: Enviar mensaje en la conversacion de la donacion
 *     tags: [Donations]
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
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *       403:
 *         description: No participante, fundacion sin mensaje previo del donante o fundacion no operativa
 *       400:
 *         description: Donacion cancelada
 */
donationsRoutes.post(
  '/:id/messages',
  authenticate,
  validate(donationIdParamSchema, 'params'),
  validate(createMessageSchema),
  donationsController.createMessage,
);

/**
 * @swagger
 * /donations/{id}/messages/read:
 *   patch:
 *     summary: Marcar mensajes de la conversacion como leidos
 *     tags: [Donations]
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
 *         description: Mensajes marcados como leidos
 *       403:
 *         description: No participante
 */
donationsRoutes.patch(
  '/:id/messages/read',
  authenticate,
  validate(donationIdParamSchema, 'params'),
  donationsController.markMessagesRead,
);

/**
 * @swagger
 * /donations/{id}:
 *   get:
 *     summary: Obtener donacion por id
 *     tags: [Donations]
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
 *         description: Donacion encontrada
 *       403:
 *         description: Sin acceso
 *       404:
 *         description: No encontrada
 */
donationsRoutes.get(
  '/:id',
  authenticate,
  validate(donationIdParamSchema, 'params'),
  donationsController.findById,
);

export { donationsRoutes };
