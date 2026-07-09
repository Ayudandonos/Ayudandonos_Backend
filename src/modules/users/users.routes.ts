import { Router } from 'express';
import { usersController } from './users.controller.js';

const usersRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

usersRoutes.get('/', usersController.findAll);

export { usersRoutes };
