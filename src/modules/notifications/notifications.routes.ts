import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { notificationsController } from './notifications.controller.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from './notifications.validations.js';

const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notificaciones in-app del usuario autenticado
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Listar notificaciones del usuario
 *     tags: [Notifications]
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
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Listado obtenido
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           type:
 *                             type: string
 *                             enum:
 *                               - DONATION_CREATED
 *                               - DONATION_STATUS_CHANGED
 *                               - DONATION_MESSAGE
 *                               - DONATION_DELIVERY_UPDATED
 *                           title:
 *                             type: string
 *                           body:
 *                             type: string
 *                           linkPath:
 *                             type: string
 *                             nullable: true
 *                           resourceType:
 *                             type: string
 *                             nullable: true
 *                           resourceId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           isRead:
 *                             type: boolean
 *                           readAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 errors:
 *                   nullable: true
 *       401:
 *         description: No autenticado
 */
notificationsRoutes.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  notificationsController.findMine,
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Contar notificaciones no leidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo obtenido
 */
notificationsRoutes.get('/unread-count', notificationsController.unreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marcar todas las notificaciones como leidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones marcadas
 */
notificationsRoutes.patch('/read-all', notificationsController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificacion como leida
 *     tags: [Notifications]
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
 *         description: Notificacion actualizada
 *       404:
 *         description: No encontrada
 */
notificationsRoutes.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationsController.markAsRead,
);

export { notificationsRoutes };
