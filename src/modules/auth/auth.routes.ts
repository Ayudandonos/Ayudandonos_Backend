import { Router } from 'express';
import { authController } from './auth.controller.js';
// import { validate } from '../../middlewares/validate.middleware.js';
// import { loginSchema, registerSchema } from './auth.validations.js';

const authRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y registro
 */

authRoutes.post('/login', authController.login);
authRoutes.post('/register', authController.register);

export { authRoutes };
