import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  registerFoundationSchema,
  registerUserSchema,
} from './auth.validations.js';

const authRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación, registro y sesión
 */

/**
 * @swagger
 * /auth/register/user:
 *   post:
 *     summary: Registrar donante (rol USER)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El correo ya está registrado
 */
authRoutes.post(
  '/register/user',
  validate(registerUserSchema),
  authController.registerUser,
);

/**
 * @swagger
 * /auth/register/foundation:
 *   post:
 *     summary: Registrar fundación (rol FOUNDATION)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, foundationName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *               foundationName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fundación registrada correctamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El correo ya está registrado
 */
authRoutes.post(
  '/register/foundation',
  validate(registerFoundationSchema),
  authController.registerFoundation,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión (USER, FOUNDATION o ADMIN)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Cuenta desactivada
 */
authRoutes.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: Token requerido o inválido
 */
authRoutes.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido correctamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
authRoutes.get('/me', authenticate, authController.me);

export { authRoutes };
