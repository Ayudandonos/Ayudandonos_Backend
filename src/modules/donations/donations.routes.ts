import { Router } from 'express';
import { donationsController } from './donations.controller.js';

const donationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Gestión de donaciones
 */

donationsRoutes.get('/', donationsController.findAll);

export { donationsRoutes };
