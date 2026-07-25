import type { PostReactionType } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import type {
  FoundationPostDetailDto,
  FoundationPostSummaryDto,
  PostCommentDto,
} from './posts.dto.js';
import type {
  CreatePostCommentInput,
  ListFoundationPostsQueryInput,
  ListPostCommentsQueryInput,
  SetPostReactionInput,
} from './posts.validations.js';
import { postsRepository, type PostWithRelations } from './posts.repository.js';

export class PostsService {
  /**
   * Entrada: foundationId y query de paginacion.
   * Proceso: Valida fundacion publica y lista posts.
   * Salida: Retorna items y meta.
   */
  async listByFoundation(
    foundationId: string,
    query: ListFoundationPostsQueryInput,
  ): Promise<{ data: { items: FoundationPostSummaryDto[] }; meta: ApiResponseMeta }> {
    const foundation = await postsRepository.findPublicFoundation(foundationId);

    if (!foundation) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_PUBLIC, 404);
    }

    const { items, total } = await postsRepository.findByFoundationPaginated(
      foundationId,
      query.page,
      query.limit,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((post) => this.toSummaryDto(post)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: foundationId, postId y userId opcional del visitante.
   * Proceso: Obtiene detalle publico del post con reaccion del viewer.
   * Salida: Retorna post detallado.
   */
  async getPublicPost(
    foundationId: string,
    postId: string,
    viewerUserId: string | null,
  ): Promise<FoundationPostDetailDto> {
    const foundation = await postsRepository.findPublicFoundation(foundationId);

    if (!foundation) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_PUBLIC, 404);
    }

    const post = await postsRepository.findPublicPostById(foundationId, postId);

    if (!post) {
      throw new AppError(API_MESSAGES.POSTS_NOT_FOUND, 404);
    }

    const viewerReaction = await postsRepository.findViewerReaction(postId, viewerUserId);

    return {
      ...this.toSummaryDto(post),
      images: post.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        sortOrder: image.sortOrder,
      })),
      lines: post.lines.map((line) => ({
        itemName: line.itemName,
        unit: line.unit,
        quantity: line.quantity,
      })),
      viewerReaction,
    };
  }

  /**
   * Entrada: postId, input y userId autenticado.
   * Proceso: Registra o actualiza reaccion del usuario.
   * Salida: Retorna tipo de reaccion activa.
   */
  async setReaction(
    postId: string,
    input: SetPostReactionInput,
    userId: string,
  ): Promise<{ type: PostReactionType }> {
    await this.requirePublicPost(postId);

    const reaction = await postsRepository.upsertReaction(postId, userId, input.type);
    return { type: reaction.type };
  }

  /**
   * Entrada: postId y userId autenticado.
   * Proceso: Elimina reaccion del usuario en el post.
   * Salida: No retorna valor.
   */
  async removeReaction(postId: string, userId: string): Promise<void> {
    await this.requirePublicPost(postId);
    await postsRepository.deleteReaction(postId, userId);
  }

  /**
   * Entrada: postId y paginacion.
   * Proceso: Lista comentarios publicos del post.
   * Salida: Retorna comentarios y meta.
   */
  async listComments(
    postId: string,
    query: ListPostCommentsQueryInput,
  ): Promise<{ data: { items: PostCommentDto[] }; meta: ApiResponseMeta }> {
    await this.requirePublicPost(postId);

    const { items, total } = await postsRepository.findCommentsPaginated(
      postId,
      query.page,
      query.limit,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: items.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.user.id,
            fullName: comment.user.fullName,
            avatarUrl: comment.user.avatarUrl,
          },
        })),
      },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: postId, input y userId autenticado.
   * Proceso: Crea comentario en post publico.
   * Salida: Retorna comentario creado.
   */
  async createComment(
    postId: string,
    input: CreatePostCommentInput,
    userId: string,
  ): Promise<PostCommentDto> {
    await this.requirePublicPost(postId);

    const created = await postsRepository.createComment(postId, userId, input.body);

    return {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      author: {
        id: created.user.id,
        fullName: created.user.fullName,
        avatarUrl: created.user.avatarUrl,
      },
    };
  }

  /**
   * Entrada: postId.
   * Proceso: Verifica que el post pertenezca a fundacion verificada.
   * Salida: Retorna post o lanza AppError.
   */
  private async requirePublicPost(postId: string) {
    const post = await postsRepository.findById(postId);

    if (!post || post.foundation.status !== 'VERIFIED') {
      throw new AppError(API_MESSAGES.POSTS_NOT_PUBLIC, 404);
    }

    return post;
  }

  /**
   * Entrada: post con relaciones.
   * Proceso: Mapea entidad a resumen publico con conteos de reacciones.
   * Salida: Retorna FoundationPostSummaryDto.
   */
  private toSummaryDto(post: PostWithRelations): FoundationPostSummaryDto {
    const reactionsCount = {
      like: post.reactions.filter((reaction) => reaction.type === 'LIKE').length,
      love: post.reactions.filter((reaction) => reaction.type === 'LOVE').length,
      proud: post.reactions.filter((reaction) => reaction.type === 'PROUD').length,
      total: post.reactions.length,
    };

    return {
      id: post.id,
      foundationId: post.foundationId,
      campaignId: post.campaignId,
      campaignTitle: post.campaign.title,
      title: post.title,
      description: post.description,
      totalQuantityDelivered: post.totalQuantityDelivered,
      slug: post.slug,
      publishedAt: post.publishedAt.toISOString(),
      coverImageUrl: post.images[0]?.imageUrl ?? null,
      reactionsCount,
      commentsCount: post._count.comments,
    };
  }
}

export const postsService = new PostsService();
