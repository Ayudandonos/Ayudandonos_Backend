import { Router } from 'express';
import { foundationsController } from './foundations.controller.js';

const foundationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Foundations
 *   description: Gestión de fundaciones
 */

foundationsRoutes.get('/', foundationsController.findAll);

export { foundationsRoutes };
