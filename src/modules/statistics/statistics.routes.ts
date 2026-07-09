import { Router } from 'express';
import { statisticsController } from './statistics.controller.js';

const statisticsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Estadísticas y reportes
 */

statisticsRoutes.get('/', statisticsController.findAll);

export { statisticsRoutes };
