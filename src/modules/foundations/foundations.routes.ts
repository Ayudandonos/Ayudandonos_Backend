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
import { foundationBranchesController } from './foundation-branches.controller.js';
import {
  createFoundationBranchSchema,
  foundationBranchIdParamSchema,
  updateFoundationBranchSchema,
} from './foundation-branches.validations.js';
import { postsController } from '../posts/posts.controller.js';
import {
  foundationPostByIdParamSchema,
  listFoundationPostsQuerySchema,
  foundationPostsListByIdParamSchema,
} from '../posts/posts.validations.js';
import {
  foundationDocumentTypeParamSchema,
  foundationIdParamSchema,
  listFoundationsQuerySchema,
  nearbyFoundationsQuerySchema,
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

/**
 * @swagger
 * /foundations:
 *   get:
 *     summary: Listar fundaciones (paginado)
 *     tags: [Foundations]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED, SUSPENDED]
 *         description: Solo ADMIN puede filtrar por estados no publicos
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 *       400:
 *         description: Validacion
 */
foundationsRoutes.get(
  '/',
  optionalAuthenticate,
  validate(listFoundationsQuerySchema, 'query'),
  foundationsController.findAll,
);

/**
 * @swagger
 * /foundations/me:
 *   get:
 *     summary: Obtener perfil completo de la fundacion autenticada
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de fundacion obtenido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.get('/me', authenticate, foundationsController.findMine);

/**
 * @swagger
 * /foundations/me/branches:
 *   get:
 *     summary: Listar sedes de acopio de la fundacion autenticada
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de sedes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 *   post:
 *     summary: Crear sede de acopio
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department, city, address, phone, openingHours]
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               reference:
 *                 type: string
 *                 nullable: true
 *               phone:
 *                 type: string
 *               openingHours:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       201:
 *         description: Sede creada
 *       400:
 *         description: Validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 */
foundationsRoutes.get(
  '/me/branches',
  authenticate,
  authorize('FOUNDATION'),
  foundationBranchesController.listMine,
);

foundationsRoutes.post(
  '/me/branches',
  authenticate,
  authorize('FOUNDATION'),
  validate(createFoundationBranchSchema),
  foundationBranchesController.create,
);

/**
 * @swagger
 * /foundations/me/branches/{branchId}:
 *   patch:
 *     summary: Actualizar sede de acopio
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
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
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               reference:
 *                 type: string
 *                 nullable: true
 *               phone:
 *                 type: string
 *               openingHours:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Sede actualizada
 *       400:
 *         description: Validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 *       404:
 *         description: Sede no encontrada
 *   delete:
 *     summary: Desactivar sede de acopio
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sede desactivada
 *       400:
 *         description: No se puede desactivar la ultima sede activa
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no permitido
 *       404:
 *         description: Sede no encontrada
 */
foundationsRoutes.patch(
  '/me/branches/:branchId',
  authenticate,
  authorize('FOUNDATION'),
  validate(foundationBranchIdParamSchema, 'params'),
  validate(updateFoundationBranchSchema),
  foundationBranchesController.update,
);

foundationsRoutes.delete(
  '/me/branches/:branchId',
  authenticate,
  authorize('FOUNDATION'),
  validate(foundationBranchIdParamSchema, 'params'),
  foundationBranchesController.deactivate,
);

foundationsRoutes.post(
  '/me/branches/:branchId/activate',
  authenticate,
  authorize('FOUNDATION'),
  validate(foundationBranchIdParamSchema, 'params'),
  foundationBranchesController.activate,
);

/**
 * @swagger
 * /foundations/nearby:
 *   get:
 *     summary: Fundaciones verificadas cercanas y tipos en radio 1-10 km
 *     tags: [Foundations]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *     responses:
 *       200:
 *         description: Resumen por categoria e items cercanos
 *       400:
 *         description: Validacion
 */
foundationsRoutes.get(
  '/nearby',
  validate(nearbyFoundationsQuerySchema, 'query'),
  foundationsController.findNearby,
);

/**
 * @swagger
 * /foundations/{id}/documents/{type}/download:
 *   get:
 *     summary: Descargar documento legal de la fundacion
 *     tags: [Foundations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [RUT, LEGAL_EXISTENCE_CERTIFICATE, LEGAL_REPRESENTATIVE_ID, BANK_CERTIFICATION]
 *     responses:
 *       200:
 *         description: Archivo del documento
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (solo owner o ADMIN)
 *       404:
 *         description: Fundacion o documento no encontrado
 */
foundationsRoutes.get(
  '/:id/documents/:type/download',
  authenticate,
  validate(foundationDocumentTypeParamSchema, 'params'),
  foundationsController.downloadDocument,
);

/**
 * @swagger
 * /foundations/{id}:
 *   get:
 *     summary: Obtener fundacion por id
 *     tags: [Foundations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fundacion encontrada
 *       403:
 *         description: Fundacion no visible publicamente
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.get(
  '/:id/posts',
  optionalAuthenticate,
  validate(foundationPostsListByIdParamSchema, 'params'),
  validate(listFoundationPostsQuerySchema, 'query'),
  postsController.listByFoundation,
);

/**
 * @swagger
 * /foundations/{id}/branches:
 *   get:
 *     summary: Listar sedes activas de una fundacion verificada
 *     tags: [Foundations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sedes obtenidas
 *       403:
 *         description: Fundacion no visible
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.get(
  '/:id/branches',
  optionalAuthenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationsController.listPublicBranches,
);

foundationsRoutes.get(
  '/:id/posts/:postId',
  optionalAuthenticate,
  validate(foundationPostByIdParamSchema, 'params'),
  postsController.getPublicPost,
);

/**
 * @swagger
 * /foundations/{id}:
 *   get:
 *     summary: Obtener detalle publico de fundacion
 *     tags: [Foundations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fundacion encontrada
 *       403:
 *         description: Fundacion no visible publicamente
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.get(
  '/:id',
  optionalAuthenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationsController.findById,
);

/**
 * @swagger
 * /foundations/{id}:
 *   patch:
 *     summary: Actualizar perfil de fundacion propia
 *     tags: [Foundations]
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
 *             properties:
 *               name:
 *                 type: string
 *               acronym:
 *                 type: string
 *                 nullable: true
 *               nit:
 *                 type: string
 *               category:
 *                 type: string
 *               mission:
 *                 type: string
 *                 nullable: true
 *               vision:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               city:
 *                 type: string
 *               department:
 *                 type: string
 *               country:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               institutionalEmail:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               legalRepresentativeName:
 *                 type: string
 *               legalRepresentativeDocument:
 *                 type: string
 *               socialLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [network, url]
 *                   properties:
 *                     network:
 *                       type: string
 *                       enum: [FACEBOOK, INSTAGRAM, X, LINKEDIN, YOUTUBE, TIKTOK, OTHER]
 *                     url:
 *                       type: string
 *                       format: uri
 *     responses:
 *       200:
 *         description: Fundacion actualizada
 *       400:
 *         description: Validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Fundacion no encontrada
 *       409:
 *         description: NIT duplicado
 */
foundationsRoutes.patch(
  '/:id',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  validate(updateFoundationSchema),
  foundationsController.update,
);

/**
 * @swagger
 * /foundations/{id}/status:
 *   patch:
 *     summary: Cambiar estado de verificacion (solo ADMIN)
 *     tags: [Foundations]
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
 *                 enum: [PENDING, VERIFIED, REJECTED, SUSPENDED]
 *               rejectionReason:
 *                 type: string
 *                 nullable: true
 *                 description: Obligatorio si status es REJECTED
 *               adminNotes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate(foundationIdParamSchema, 'params'),
  validate(updateFoundationStatusSchema),
  foundationsController.updateStatus,
);

/**
 * @swagger
 * /foundations/{id}/logo:
 *   post:
 *     summary: Subir o reemplazar logo de la fundacion
 *     tags: [Foundations]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Imagen JPEG, PNG o WebP
 *     responses:
 *       200:
 *         description: Logo actualizado
 *       400:
 *         description: Archivo invalido o validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.post(
  '/:id/logo',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationLogoUpload,
  foundationsController.uploadLogo,
);

/**
 * @swagger
 * /foundations/{id}/documents:
 *   post:
 *     summary: Subir o reemplazar documento legal de la fundacion
 *     tags: [Foundations]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [type, file]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [RUT, LEGAL_EXISTENCE_CERTIFICATE, LEGAL_REPRESENTATIVE_ID, BANK_CERTIFICATION]
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF o imagen JPEG/PNG
 *     responses:
 *       200:
 *         description: Documento cargado
 *       400:
 *         description: Archivo invalido o validacion
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Fundacion no encontrada
 */
foundationsRoutes.post(
  '/:id/documents',
  authenticate,
  validate(foundationIdParamSchema, 'params'),
  foundationDocumentUpload,
  validate(uploadDocumentBodySchema),
  foundationsController.uploadDocument,
);

export { foundationsRoutes };
