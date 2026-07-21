import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { foundationOperationalRouter } from './foundation-operational.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { foundationsRoutes } from '../modules/foundations/foundations.routes.js';
import { campaignsRoutes } from '../modules/campaigns/campaigns.routes.js';
import { needsRoutes } from '../modules/needs/needs.routes.js';
import { donationsRoutes } from '../modules/donations/donations.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/foundations', foundationsRoutes);
apiRouter.use('/foundation', foundationOperationalRouter);
apiRouter.use('/campaigns', campaignsRoutes);
apiRouter.use('/needs', needsRoutes);
apiRouter.use('/donations', donationsRoutes);
apiRouter.use('/admin', adminRoutes);

export { apiRouter };
