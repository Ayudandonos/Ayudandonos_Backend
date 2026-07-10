import { Router } from 'express';
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from '../../middlewares/auth.middleware.js';
import {
  foundationDocumentUpload,
  foundationLogoUpload,
} from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { foundationsController } from './foundations.controller.js';
import {
  foundationDocumentTypeParamSchema,
  foundationIdParamSchema,
  listFoundationsQuerySchema,
  updateFoundationSchema,
  updateFoundationStatusSchema,
  uploadDocumentBodySchema,
} from './foundations.validations.js';

const foundationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Foundations
 *   description: Gestion de fundaciones
 */

foundationsRoutes.get(
  '/',
  optionalAuthenticate,
  validate(listFoundationsQuerySchema, 'query'),
  foundationsController.findAll,
);

foundationsRoutes.get('/me', authenticate, foundationsController.findMine);

foundationsRoutes.get(
  '/:id/documents/:type/download',
  authenticate,
  validate(foundationDocumentTypeParamSchema, 'params'),
  foundationsController.downloadDocument,
);

foundationsRoutes.get(
  '/:id',
  optionalAuthenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationsController.findById,
);

foundationsRoutes.patch(
  '/:id',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  validate(updateFoundationSchema),
  foundationsController.update,
);

foundationsRoutes.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate(foundationIdParamSchema, 'params'),
  validate(updateFoundationStatusSchema),
  foundationsController.updateStatus,
);

foundationsRoutes.post(
  '/:id/logo',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationLogoUpload,
  foundationsController.uploadLogo,
);

foundationsRoutes.post(
  '/:id/documents',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationDocumentUpload,
  validate(uploadDocumentBodySchema),
  foundationsController.uploadDocument,
);

export { foundationsRoutes };
