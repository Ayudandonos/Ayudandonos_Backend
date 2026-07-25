import { FoundationStatus, PostReactionType, type FoundationPost } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';

export type PostWithRelations = FoundationPost & {
  campaign: { id: string; title: string };
  images: { id: string; imageUrl: string; sortOrder: number }[];
  lines: { itemName: string; unit: string; quantity: number }[];
  reactions: { type: PostReactionType }[];
  _count: { comments: number };
};

/**
 * Entrada: Ninguna.
 * Proceso: Acceso a datos de publicaciones de fundaciones.
 * Salida: Retorna metodos del repositorio.
 */
export const postsRepository = {
  /**
   * Entrada: foundationId y paginacion.
   * Proceso: Lista posts publicos de fundacion verificada.
   * Salida: Retorna items y total.
   */
  async findByFoundationPaginated(
    foundationId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PostWithRelations[]; total: number }> {
    const where = { foundationId };

    const [items, total] = await Promise.all([
      prisma.foundationPost.findMany({
        where,
        include: {
          campaign: { select: { id: true, title: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          lines: true,
          reactions: { select: { type: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.foundationPost.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Entrada: foundationId y postId.
   * Proceso: Busca detalle de post publico.
   * Salida: Retorna post o null.
   */
  async findPublicPostById(
    foundationId: string,
    postId: string,
  ): Promise<PostWithRelations | null> {
    return prisma.foundationPost.findFirst({
      where: { id: postId, foundationId },
      include: {
        campaign: { select: { id: true, title: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        lines: true,
        reactions: { select: { type: true } },
        _count: { select: { comments: true } },
      },
    });
  },

  /**
   * Entrada: postId.
   * Proceso: Busca post por id con fundacion.
   * Salida: Retorna post o null.
   */
  async findById(postId: string) {
    return prisma.foundationPost.findUnique({
      where: { id: postId },
      include: {
        foundation: { select: { id: true, status: true } },
        campaign: { select: { id: true, title: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        lines: true,
        reactions: { select: { type: true } },
        _count: { select: { comments: true } },
      },
    });
  },

  /**
   * Entrada: foundationId.
   * Proceso: Verifica que la fundacion sea publica (verificada).
   * Salida: Retorna fundacion o null.
   */
  async findPublicFoundation(foundationId: string) {
    return prisma.foundation.findFirst({
      where: {
        id: foundationId,
        status: FoundationStatus.VERIFIED,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });
  },

  /**
   * Entrada: postId, userId y tipo de reaccion.
   * Proceso: Crea o actualiza reaccion del usuario.
   * Salida: Retorna reaccion persistida.
   */
  async upsertReaction(postId: string, userId: string, type: PostReactionType) {
    return prisma.postReaction.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId, type },
      update: { type },
    });
  },

  /**
   * Entrada: postId y userId.
   * Proceso: Elimina reaccion del usuario en el post.
   * Salida: No retorna valor.
   */
  async deleteReaction(postId: string, userId: string): Promise<void> {
    await prisma.postReaction.deleteMany({
      where: { postId, userId },
    });
  },

  /**
   * Entrada: postId, userId y tipo opcional para consulta de reaccion del viewer.
   * Proceso: Obtiene reaccion del usuario autenticado.
   * Salida: Retorna tipo o null.
   */
  async findViewerReaction(postId: string, userId: string | null) {
    if (!userId) return null;

    const reaction = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { type: true },
    });

    return reaction?.type ?? null;
  },

  /**
   * Entrada: postId y paginacion.
   * Proceso: Lista comentarios del post.
   * Salida: Retorna comentarios y total.
   */
  async findCommentsPaginated(postId: string, page: number, limit: number) {
    const where = { postId };

    const [items, total] = await Promise.all([
      prisma.postComment.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.postComment.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Entrada: postId, userId y cuerpo del comentario.
   * Proceso: Persiste comentario en el post.
   * Salida: Retorna comentario con autor.
   */
  async createComment(postId: string, userId: string, body: string) {
    return prisma.postComment.create({
      data: { postId, userId, body },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  },
};
