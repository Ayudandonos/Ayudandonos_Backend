import { Router } from 'express';
import {
  authenticate,
  authorize,
} from '../../middlewares/auth.middleware.js';
import { requireFoundationOperational } from '../../middlewares/foundation-access.middleware.js';
import { postImagesUpload } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { inventoryController } from './inventory.controller.js';
import { listInventoryMovementsQuerySchema } from './inventory.validations.js';

const inventoryRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventario trazable de fundacion (solo lectura y salidas)
 */

inventoryRoutes.get(
  '/items',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  inventoryController.listItems,
);

inventoryRoutes.get(
  '/movements',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(listInventoryMovementsQuerySchema, 'query'),
  inventoryController.listMovements,
);

inventoryRoutes.get(
  '/outbounds',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  validate(listInventoryMovementsQuerySchema, 'query'),
  inventoryController.listOutbounds,
);

inventoryRoutes.post(
  '/outbound',
  authenticate,
  authorize('FOUNDATION'),
  requireFoundationOperational,
  postImagesUpload,
  inventoryController.createOutbound,
);

export { inventoryRoutes };
