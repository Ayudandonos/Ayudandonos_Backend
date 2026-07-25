import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { postsController } from './posts.controller.js';
import {
  createPostCommentSchema,
  listPostCommentsQuerySchema,
  postIdParamSchema,
  setPostReactionSchema,
} from './posts.validations.js';

const postsRoutes = Router();

postsRoutes.post(
  '/:postId/reactions',
  authenticate,
  authorize('USER', 'FOUNDATION', 'ADMIN'),
  validate(postIdParamSchema, 'params'),
  validate(setPostReactionSchema),
  postsController.setReaction,
);

postsRoutes.delete(
  '/:postId/reactions',
  authenticate,
  authorize('USER', 'FOUNDATION', 'ADMIN'),
  validate(postIdParamSchema, 'params'),
  postsController.removeReaction,
);

postsRoutes.get(
  '/:postId/comments',
  validate(postIdParamSchema, 'params'),
  validate(listPostCommentsQuerySchema, 'query'),
  postsController.listComments,
);

postsRoutes.post(
  '/:postId/comments',
  authenticate,
  authorize('USER', 'FOUNDATION', 'ADMIN'),
  validate(postIdParamSchema, 'params'),
  validate(createPostCommentSchema),
  postsController.createComment,
);

export { postsRoutes };

export {
  foundationIdParamSchema,
  foundationPostParamSchema,
  listFoundationPostsQuerySchema,
} from './posts.validations.js';

export { postsController } from './posts.controller.js';
