import { Router } from 'express';
import { campaignsController } from './campaigns.controller.js';

const campaignsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Gestión de campañas
 */

campaignsRoutes.get('/', campaignsController.findAll);

export { campaignsRoutes };
