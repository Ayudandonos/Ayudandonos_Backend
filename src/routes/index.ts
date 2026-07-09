import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);

// Fase 2+: descomentar según se implementen módulos
// apiRouter.use('/foundations', foundationsRoutes);
// apiRouter.use('/campaigns', campaignsRoutes);
// apiRouter.use('/needs', needsRoutes);
// apiRouter.use('/donations', donationsRoutes);
// apiRouter.use('/notifications', notificationsRoutes);
// apiRouter.use('/statistics', statisticsRoutes);

export { apiRouter };
