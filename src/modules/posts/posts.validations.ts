import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

export const foundationIdParamSchema = z.object({
  foundationId: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
});

export const foundationPostParamSchema = z.object({
  foundationId: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
  postId: z.string().uuid(VALIDATION_MESSAGES.INVALID_POST_UUID),
});

export const foundationPostsListByIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
});

export const foundationPostByIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_FOUNDATION_UUID),
  postId: z.string().uuid(VALIDATION_MESSAGES.INVALID_POST_UUID),
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid(VALIDATION_MESSAGES.INVALID_POST_UUID),
});

export const listFoundationPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const listPostCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const setPostReactionSchema = z.object({
  type: z.enum(['LIKE', 'LOVE', 'PROUD'], {
    message: VALIDATION_MESSAGES.POST_REACTION_TYPE_INVALID,
  }),
});

export const createPostCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.POST_COMMENT_BODY_MIN_LENGTH)
    .max(2000, VALIDATION_MESSAGES.POST_COMMENT_BODY_MAX_LENGTH),
});

export type FoundationIdParamInput = z.infer<typeof foundationIdParamSchema>;
export type FoundationPostParamInput = z.infer<typeof foundationPostParamSchema>;
export type PostIdParamInput = z.infer<typeof postIdParamSchema>;
export type ListFoundationPostsQueryInput = z.infer<typeof listFoundationPostsQuerySchema>;
export type ListPostCommentsQueryInput = z.infer<typeof listPostCommentsQuerySchema>;
export type SetPostReactionInput = z.infer<typeof setPostReactionSchema>;
export type CreatePostCommentInput = z.infer<typeof createPostCommentSchema>;
