import type { Prisma } from '@prisma/client';
import { FoundationDocumentType, FoundationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  ListFoundationsQueryDto,
  UpdateFoundationData,
  UpdateFoundationStatusDto,
} from './foundations.dto.js';
import type { FoundationSocialLinkDto } from './foundations.dto.js';
import type { GeoBoundingBox } from '../../shared/utils/geo.util.js';

const foundationInclude = {
  user: true,
  socialLinks: true,
  documents: true,
  observations: {
    include: { author: true },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.FoundationInclude;

export type FoundationWithRelations = Prisma.FoundationGetPayload<{
  include: typeof foundationInclude;
}>;

export class FoundationsRepository {
  /**
   * Entrada: query: filtros y paginacion; whereOverride: condiciones segun rol.
   * Proceso: Consulta fundaciones paginadas con representante y relaciones basicas.
   * Salida: Retorna items y total de registros.
   */
  async findManyPaginated(
    query: ListFoundationsQueryDto,
    whereOverride: Prisma.FoundationWhereInput = {},
  ): Promise<{ items: FoundationWithRelations[]; total: number }> {
    const where: Prisma.FoundationWhereInput = {
      ...whereOverride,
      user: { isActive: true },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }

    if (query.department) {
      where.department = { equals: query.department, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { acronym: { contains: query.search, mode: 'insensitive' } },
        { nit: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
      prisma.foundation.findMany({
        where,
        include: foundationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.foundation.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Calcula totales agregados por estado para panel administrativo.
   * Salida: Retorna conteos por estado.
   */
  async getStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    suspended: number;
  }> {
    const baseWhere: Prisma.FoundationWhereInput = {
      user: { isActive: true },
    };

    const [total, verified, pending, rejected, suspended] = await prisma.$transaction([
      prisma.foundation.count({ where: baseWhere }),
      prisma.foundation.count({ where: { ...baseWhere, status: FoundationStatus.VERIFIED } }),
      prisma.foundation.count({ where: { ...baseWhere, status: FoundationStatus.PENDING } }),
      prisma.foundation.count({ where: { ...baseWhere, status: FoundationStatus.REJECTED } }),
      prisma.foundation.count({ where: { ...baseWhere, status: FoundationStatus.SUSPENDED } }),
    ]);

    return { total, verified, pending, rejected, suspended };
  }

  /**
   * Entrada: id: identificador UUID de la fundacion.
   * Proceso: Busca fundacion con usuario, redes sociales y documentos.
   * Salida: Retorna la fundacion o null.
   */
  async findByIdWithRelations(id: string): Promise<FoundationWithRelations | null> {
    return prisma.foundation.findUnique({
      where: { id },
      include: foundationInclude,
    });
  }

  /**
   * Entrada: box: bounding box aproximado alrededor del origen.
   * Proceso: Lista fundaciones VERIFIED con coordenadas dentro del box.
   * Salida: Retorna candidatas con relaciones basicas.
   */
  async findVerifiedInBoundingBox(
    box: GeoBoundingBox,
  ): Promise<FoundationWithRelations[]> {
    return prisma.foundation.findMany({
      where: {
        status: FoundationStatus.VERIFIED,
        deletedAt: null,
        latitude: {
          not: null,
          gte: box.minLatitude,
          lte: box.maxLatitude,
        },
        longitude: {
          not: null,
          gte: box.minLongitude,
          lte: box.maxLongitude,
        },
        user: { isActive: true },
      },
      include: foundationInclude,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Entrada: userId: identificador del usuario representante.
   * Proceso: Busca la fundacion asociada a un usuario con relaciones.
   * Salida: Retorna la fundacion o null.
   */
  async findByUserId(userId: string): Promise<FoundationWithRelations | null> {
    return prisma.foundation.findUnique({
      where: { userId },
      include: foundationInclude,
    });
  }

  /**
   * Entrada: nit: numero de identificacion tributaria.
   * Proceso: Verifica si ya existe otra fundacion con el mismo NIT.
   * Salida: Retorna la fundacion encontrada o null.
   */
  async findByNit(nit: string): Promise<{ id: string } | null> {
    return prisma.foundation.findUnique({
      where: { nit },
      select: { id: true },
    });
  }

  /**
   * Entrada: id: identificador; profileData: campos de perfil; socialLinks: redes opcionales.
   * Proceso: Actualiza perfil y redes sociales en una transaccion atomica.
   * Salida: Retorna la fundacion actualizada con relaciones.
   */
  async updateProfileWithSocialLinks(
    id: string,
    profileData: UpdateFoundationData,
    socialLinks?: FoundationSocialLinkDto[],
  ): Promise<FoundationWithRelations> {
    return prisma.$transaction(async (tx) => {
      await tx.foundation.update({
        where: { id },
        data: profileData,
      });

      if (socialLinks !== undefined) {
        const networks = socialLinks.map((link) => link.network);

        if (networks.length === 0) {
          await tx.foundationSocialLink.deleteMany({ where: { foundationId: id } });
        } else {
          await tx.foundationSocialLink.deleteMany({
            where: {
              foundationId: id,
              network: { notIn: networks },
            },
          });

          for (const link of socialLinks) {
            await tx.foundationSocialLink.upsert({
              where: {
                foundationId_network: {
                  foundationId: id,
                  network: link.network,
                },
              },
              create: {
                foundationId: id,
                network: link.network,
                url: link.url,
              },
              update: {
                url: link.url,
              },
            });
          }
        }
      }

      return tx.foundation.findUniqueOrThrow({
        where: { id },
        include: foundationInclude,
      });
    });
  }

  /**
   * Entrada: id: identificador de la fundacion; data: campos a actualizar.
   * Proceso: Persiste cambios del perfil organizacional.
   * Salida: Retorna la fundacion actualizada con relaciones.
   */
  async updateById(id: string, data: UpdateFoundationData): Promise<FoundationWithRelations> {
    return prisma.foundation.update({
      where: { id },
      data,
      include: foundationInclude,
    });
  }

  /**
   * Entrada: id: identificador de la fundacion; input: nuevo estado y metadatos admin.
   * Proceso: Actualiza estado de verificacion y timestamps asociados.
   * Salida: Retorna la fundacion actualizada.
   */
  async updateStatus(
    id: string,
    input: UpdateFoundationStatusDto,
    authorId?: string,
  ): Promise<FoundationWithRelations> {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const statusData: Prisma.FoundationUpdateInput = {
        status: input.status,
        rejectionReason:
          input.status === FoundationStatus.REJECTED ? input.rejectionReason ?? null : null,
        adminNotes: input.adminNotes ?? undefined,
      };

      if (input.status === FoundationStatus.VERIFIED) {
        statusData.verifiedAt = now;
        statusData.verifiedBy = authorId ? { connect: { id: authorId } } : undefined;
      }

      if (input.status === FoundationStatus.REJECTED) {
        statusData.rejectedAt = now;
      }

      if (input.status === FoundationStatus.SUSPENDED) {
        statusData.suspendedAt = now;
      }

      await tx.foundation.update({
        where: { id },
        data: statusData,
      });

      if (input.adminNotes?.trim()) {
        await tx.foundationAdminObservation.create({
          data: {
            foundationId: id,
            authorId: authorId ?? null,
            content: input.adminNotes.trim(),
          },
        });
      }

      return tx.foundation.findUniqueOrThrow({
        where: { id },
        include: foundationInclude,
      });
    });
  }

  /**
   * Entrada: foundationId: identificador de la fundacion; links: redes sociales.
   * Proceso: Reemplaza las redes sociales de la fundacion mediante upsert y elimina las no enviadas.
   * Salida: Retorna void.
   */
  async replaceSocialLinks(foundationId: string, links: FoundationSocialLinkDto[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const networks = links.map((link) => link.network);

      if (networks.length === 0) {
        await tx.foundationSocialLink.deleteMany({ where: { foundationId } });
        return;
      }

      await tx.foundationSocialLink.deleteMany({
        where: {
          foundationId,
          network: { notIn: networks },
        },
      });

      for (const link of links) {
        await tx.foundationSocialLink.upsert({
          where: {
            foundationId_network: {
              foundationId,
              network: link.network,
            },
          },
          create: {
            foundationId,
            network: link.network,
            url: link.url,
          },
          update: {
            url: link.url,
          },
        });
      }
    });
  }

  /**
   * Entrada: foundationId: identificador; type: tipo documental; metadata: datos del archivo.
   * Proceso: Crea o reemplaza un documento de fundacion por tipo.
   * Salida: Retorna el documento persistido.
   */
  async upsertDocument(
    foundationId: string,
    type: FoundationDocumentType,
    metadata: {
      fileUrl: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
    },
  ) {
    return prisma.foundationDocument.upsert({
      where: {
        foundationId_type: {
          foundationId,
          type,
        },
      },
      create: {
        foundationId,
        type,
        ...metadata,
      },
      update: {
        ...metadata,
        uploadedAt: new Date(),
      },
    });
  }

  /**
   * Entrada: foundationId: identificador; type: tipo documental.
   * Proceso: Elimina un documento de fundacion por tipo.
   * Salida: Retorna el documento eliminado o null.
   */
  async deleteDocumentByType(foundationId: string, type: FoundationDocumentType) {
    return prisma.foundationDocument.delete({
      where: {
        foundationId_type: {
          foundationId,
          type,
        },
      },
    });
  }
}

export const foundationsRepository = new FoundationsRepository();
