import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';

const notificationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones
 */

notificationsRoutes.get('/', notificationsController.findAll);

export { notificationsRoutes };
