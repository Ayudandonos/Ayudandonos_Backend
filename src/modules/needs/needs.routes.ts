import { Router } from 'express';
import { needsController } from './needs.controller.js';

const needsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Needs
 *   description: Gestión de necesidades
 */

needsRoutes.get('/', needsController.findAll);

export { needsRoutes };
