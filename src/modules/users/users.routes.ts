import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { usersController } from './users.controller.js';
import {
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.validations.js';

const usersRoutes = Router();

usersRoutes.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion de usuarios y perfiles
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios (paginado)
 *     tags: [Users]
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
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, FOUNDATION, ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 *       403:
 *         description: Solo administradores
 */
usersRoutes.get(
  '/',
  authorize('ADMIN'),
  validate(listUsersQuerySchema, 'query'),
  usersController.findAll,
);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener perfil propio (con stats de donaciones si es USER)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido
 *       401:
 *         description: No autenticado
 *   patch:
 *     summary: Actualizar perfil propio
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *               city:
 *                 type: string
 *                 nullable: true
 *               department:
 *                 type: string
 *                 nullable: true
 *               bio:
 *                 type: string
 *                 nullable: true
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       400:
 *         description: Validacion
 *       401:
 *         description: No autenticado
 */
usersRoutes.get('/me', usersController.findMe);
usersRoutes.patch(
  '/me',
  validate(updateUserSchema),
  usersController.updateMe,
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por id
 *     tags: [Users]
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
 *         description: Usuario encontrado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Usuario no encontrado
 */
usersRoutes.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  usersController.findById,
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Actualizar perfil de usuario
 *     tags: [Users]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *               city:
 *                 type: string
 *                 nullable: true
 *               department:
 *                 type: string
 *                 nullable: true
 *               bio:
 *                 type: string
 *                 nullable: true
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *               role:
 *                 type: string
 *                 enum: [USER, FOUNDATION, ADMIN]
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Usuario no encontrado
 */
usersRoutes.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  usersController.update,
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Desactivar usuario (soft delete)
 *     tags: [Users]
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
 *         description: Usuario desactivado
 *       400:
 *         description: Operacion no permitida
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Usuario no encontrado
 */
usersRoutes.delete(
  '/:id',
  authorize('ADMIN'),
  validate(userIdParamSchema, 'params'),
  usersController.deactivate,
);

export { usersRoutes };
