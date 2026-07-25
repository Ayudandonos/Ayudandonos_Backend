import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { postsService } from './posts.service.js';
import type {
  CreatePostCommentInput,
  FoundationIdParamInput,
  FoundationPostParamInput,
  ListFoundationPostsQueryInput,
  ListPostCommentsQueryInput,
  PostIdParamInput,
  SetPostReactionInput,
} from './posts.validations.js';

export class PostsController {
  /**
   * Entrada: req: peticion con foundationId y paginacion; res: respuesta HTTP.
   * Proceso: Delega listado publico de posts al servicio.
   * Salida: No retorna valor; responde 200 con items y meta.
   */
  listByFoundation = asyncHandler(async (req: Request, res: Response) => {
    const foundationId =
      (req.params as FoundationIdParamInput & { id?: string }).foundationId ??
      (req.params as { id: string }).id;
    const query = req.query as unknown as ListFoundationPostsQueryInput;
    const result = await postsService.listByFoundation(foundationId, query);

    res.status(200).json(
      ApiResponseBuilder.success(result.data, API_MESSAGES.POSTS_LIST_SUCCESS, result.meta),
    );
  });

  /**
   * Entrada: req: peticion con foundationId y postId; res: respuesta HTTP.
   * Proceso: Delega detalle publico del post al servicio.
   * Salida: No retorna valor; responde 200 con post.
   */
  getPublicPost = asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as FoundationPostParamInput & { id?: string; postId: string };
    const foundationId = params.foundationId ?? params.id!;
    const postId = params.postId;
    const auth = req as AuthenticatedRequest;
    const data = await postsService.getPublicPost(
      foundationId,
      postId,
      auth.user?.id ?? null,
    );

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.POSTS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con postId y tipo; res: respuesta HTTP.
   * Proceso: Delega registro de reaccion al servicio.
   * Salida: No retorna valor; responde 200 con reaccion activa.
   */
  setReaction = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params as PostIdParamInput;
    const auth = req as AuthenticatedRequest;
    const body = req.body as SetPostReactionInput;
    const data = await postsService.setReaction(postId, body, auth.user!.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.POSTS_REACTION_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con postId; res: respuesta HTTP.
   * Proceso: Delega eliminacion de reaccion al servicio.
   * Salida: No retorna valor; responde 200.
   */
  removeReaction = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params as PostIdParamInput;
    const auth = req as AuthenticatedRequest;
    await postsService.removeReaction(postId, auth.user!.id);

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.POSTS_REACTION_REMOVED_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con postId y paginacion; res: respuesta HTTP.
   * Proceso: Delega listado de comentarios al servicio.
   * Salida: No retorna valor; responde 200 con comentarios.
   */
  listComments = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params as PostIdParamInput;
    const query = req.query as unknown as ListPostCommentsQueryInput;
    const result = await postsService.listComments(postId, query);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.POSTS_COMMENTS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada con postId y body; res: respuesta HTTP.
   * Proceso: Delega creacion de comentario al servicio.
   * Salida: No retorna valor; responde 201 con comentario.
   */
  createComment = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params as PostIdParamInput;
    const auth = req as AuthenticatedRequest;
    const body = req.body as CreatePostCommentInput;
    const data = await postsService.createComment(postId, body, auth.user!.id);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.POSTS_COMMENT_SUCCESS),
    );
  });
}

export const postsController = new PostsController();
