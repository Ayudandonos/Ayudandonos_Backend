import { FoundationDocumentType, FoundationStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { mapUnknownError } from '../../shared/errors/map-unknown-error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { deleteStoredFile, resolveStoragePath, saveFoundationFile } from '../../shared/utils/upload.util.js';
import {
  hasRequiredFoundationDocuments,
  isFoundationProfileComplete,
  REQUIRED_FOUNDATION_DOCUMENT_TYPES,
} from './foundation-profile.util.js';
import type {
  FoundationDetailDto,
  ListFoundationsQueryDto,
  NearbyFoundationsQueryDto,
  NearbyFoundationsResultDto,
  PaginatedFoundationsResult,
  UpdateFoundationDto,
  UpdateFoundationStatusDto,
} from './foundations.dto.js';
import {
  resolveViewerContext,
  toFoundationDetail,
  toFoundationListItem,
} from './foundations.mapper.js';
import {
  foundationsRepository,
  type FoundationWithRelations,
} from './foundations.repository.js';
import {
  boundingBoxForRadius,
  haversineDistanceKm,
} from '../../shared/utils/geo.util.js';

interface RequesterContext {
  id: string;
  role: string;
}

export class FoundationsService {
  /**
   * Entrada: query: filtros de listado; requester: usuario autenticado opcional.
   * Proceso: Publico ve solo VERIFIED; admin puede filtrar por cualquier estado y recibe stats.
   * Salida: Retorna listado paginado y meta; stats solo para admin.
   */
  async listFoundations(
    query: ListFoundationsQueryDto,
    requester?: RequesterContext,
  ): Promise<PaginatedFoundationsResult> {
    const isAdmin = requester?.role === 'ADMIN';
    const whereOverride = isAdmin ? {} : { status: FoundationStatus.VERIFIED };

    if (!isAdmin && query.status !== undefined) {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }

    const { items, total } = await foundationsRepository.findManyPaginated(
      query,
      whereOverride,
    );

    const totalPages = Math.ceil(total / query.limit) || 1;
    const viewer = isAdmin ? 'ADMIN' : 'PUBLIC';

    if (isAdmin) {
      const stats = await foundationsRepository.getStats();
      return {
        data: {
          items: items.map((foundation) => toFoundationListItem(foundation, viewer)),
          stats,
        },
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };
    }

    return {
      data: {
        items: items.map((foundation) => toFoundationListItem(foundation, viewer)),
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
   * Entrada: query: origen GPS y radio en km (1-10).
   * Proceso: Filtra fundaciones VERIFIED cercanas y agrega tipos (categorias).
   * Salida: Retorna resumen por categoria e items ordenados por distancia.
   */
  async findNearby(query: NearbyFoundationsQueryDto): Promise<NearbyFoundationsResultDto> {
    const origin = {
      latitude: query.latitude,
      longitude: query.longitude,
    };
    const box = boundingBoxForRadius(origin, query.radiusKm);
    const candidates = await foundationsRepository.findVerifiedInBoundingBox(box);

    const items = candidates
      .filter(
        (foundation) =>
          foundation.latitude !== null && foundation.longitude !== null,
      )
      .map((foundation) => {
        const distanceKm = haversineDistanceKm(origin, {
          latitude: foundation.latitude as number,
          longitude: foundation.longitude as number,
        });

        return {
          id: foundation.id,
          name: foundation.name,
          acronym: foundation.acronym,
          category: foundation.category,
          city: foundation.city,
          logoUrl: foundation.logoUrl,
          latitude: foundation.latitude as number,
          longitude: foundation.longitude as number,
          distanceKm: Math.round(distanceKm * 100) / 100,
        };
      })
      .filter((item) => item.distanceKm <= query.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const categoryMap = new Map<string, number>();
    for (const item of items) {
      const key = item.category?.trim() || 'Sin categoria';
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
    }

    const categories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

    return {
      radiusKm: query.radiusKm,
      origin,
      total: items.length,
      categories,
      items,
    };
  }

  /**
   * Entrada: id: identificador de la fundacion; requester: usuario autenticado opcional.
   * Proceso: Publico accede solo si esta VERIFIED; admin y owner acceden siempre.
   * Salida: Retorna detalle filtrado segun rol del solicitante.
   */
  async getFoundationById(
    id: string,
    requester?: RequesterContext,
  ): Promise<FoundationDetailDto> {
    const foundation = await foundationsRepository.findByIdWithRelations(id);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    this.assertCanViewFoundation(foundation, requester);

    return this.toDetailResponse(foundation, requester);
  }

  /**
   * Entrada: requester: usuario autenticado con rol FOUNDATION.
   * Proceso: Obtiene el perfil de fundacion del usuario autenticado.
   * Salida: Retorna detalle de la fundacion propia.
   */
  async getMyFoundation(requester: RequesterContext): Promise<FoundationDetailDto> {
    if (requester.role !== 'FOUNDATION') {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }

    try {
      const foundation = await foundationsRepository.findByUserId(requester.id);

      if (!foundation || !foundation.user.isActive) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      return this.toDetailResponse(foundation, requester);
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: id: identificador; input: datos a actualizar; requester: usuario autenticado.
   * Proceso: Permite actualizar perfil al owner o admin; valida NIT unico.
   * Salida: Retorna la fundacion actualizada.
   */
  async updateFoundation(
    id: string,
    input: UpdateFoundationDto,
    requester: RequesterContext,
  ): Promise<FoundationDetailDto> {
    try {
      const foundation = await foundationsRepository.findByIdWithRelations(id);

      if (!foundation || !foundation.user.isActive) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      this.assertCanManageFoundation(foundation, requester);

      if (input.nit && input.nit !== foundation.nit) {
        const existing = await foundationsRepository.findByNit(input.nit);
        if (existing && existing.id !== foundation.id) {
          throw new AppError(API_MESSAGES.FOUNDATIONS_NIT_ALREADY_EXISTS, 409);
        }
      }

      const { socialLinks, ...profileData } = input;

      const updated = await foundationsRepository.updateProfileWithSocialLinks(
        id,
        profileData,
        socialLinks,
      );

      return this.toDetailResponse(updated, requester);
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: id: identificador; input: nuevo estado; requester: administrador.
   * Proceso: Valida transiciones de estado y completitud del perfil antes de verificar.
   * Salida: Retorna la fundacion con estado actualizado.
   */
  async updateFoundationStatus(
    id: string,
    input: UpdateFoundationStatusDto,
    requester: RequesterContext,
  ): Promise<FoundationDetailDto> {
    this.assertIsAdmin(requester);

    const foundation = await foundationsRepository.findByIdWithRelations(id);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    if (foundation.status === input.status) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_STATUS_ALREADY_SET, 400);
    }

    if (input.status === FoundationStatus.VERIFIED) {
      this.assertProfileReadyForVerification(foundation);
    }

    const updatedFoundation = await foundationsRepository.updateStatus(id, input, requester.id);
    return this.toDetailResponse(updatedFoundation, requester);
  }

  /**
   * Entrada: id: identificador; file: archivo de logo; requester: owner o admin.
   * Proceso: Reemplaza el logo de la fundacion en almacenamiento local.
   * Salida: Retorna detalle actualizado.
   */
  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    requester: RequesterContext,
  ): Promise<FoundationDetailDto> {
    try {
      const foundation = await foundationsRepository.findByIdWithRelations(id);

      if (!foundation || !foundation.user.isActive) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      this.assertCanManageFoundation(foundation, requester);

      const saved = await saveFoundationFile(id, 'logo', file);
      const previousLogo = foundation.logoUrl;

      try {
        await foundationsRepository.updateById(id, { logoUrl: saved.publicUrl });
      } catch (error) {
        await deleteStoredFile(saved.storageKey);
        throw mapUnknownError(error);
      }

      if (previousLogo) {
        await deleteStoredFile(previousLogo);
      }

      const refreshed = await foundationsRepository.findByIdWithRelations(id);
      if (!refreshed) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      return this.toDetailResponse(refreshed, requester);
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: id: identificador; type: tipo documental; file: archivo; requester: owner o admin.
   * Proceso: Crea o reemplaza un documento legal de la fundacion en almacenamiento privado.
   * Salida: Retorna detalle actualizado.
   */
  async uploadDocument(
    id: string,
    type: FoundationDocumentType,
    file: Express.Multer.File,
    requester: RequesterContext,
  ): Promise<FoundationDetailDto> {
    try {
      const foundation = await foundationsRepository.findByIdWithRelations(id);

      if (!foundation || !foundation.user.isActive) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      this.assertCanManageFoundation(foundation, requester);

      const existing = foundation.documents.find((doc) => doc.type === type);
      const saved = await saveFoundationFile(id, 'documents', file);

      try {
        await foundationsRepository.upsertDocument(id, type, {
          fileUrl: saved.storageKey,
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
        });
      } catch (error) {
        await deleteStoredFile(saved.storageKey);
        throw mapUnknownError(error);
      }

      if (existing?.fileUrl) {
        await deleteStoredFile(existing.fileUrl);
      }

      const refreshed = await foundationsRepository.findByIdWithRelations(id);
      if (!refreshed) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      return this.toDetailResponse(refreshed, requester);
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: id: identificador; type: tipo documental; requester: owner o admin.
   * Proceso: Valida permisos de gestion y resuelve la ruta del documento para descarga.
   * Salida: Retorna metadatos del documento y ruta absoluta en disco.
   */
  async getDocumentDownload(
    id: string,
    type: FoundationDocumentType,
    requester: RequesterContext,
  ): Promise<{ absolutePath: string; fileName: string; mimeType: string }> {
    try {
      const foundation = await foundationsRepository.findByIdWithRelations(id);

      if (!foundation || !foundation.user.isActive) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
      }

      this.assertCanManageFoundation(foundation, requester);

      const document = foundation.documents.find((doc) => doc.type === type);

      if (!document) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_DOCUMENT_NOT_FOUND, 404);
      }

      const absolutePath = resolveStoragePath(document.fileUrl);

      if (!absolutePath) {
        throw new AppError(API_MESSAGES.FOUNDATIONS_DOCUMENT_NOT_FOUND, 404);
      }

      return {
        absolutePath,
        fileName: document.fileName,
        mimeType: document.mimeType,
      };
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: requester: usuario autenticado.
   * Proceso: Verifica que el rol sea ADMIN.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertIsAdmin(requester: RequesterContext): void {
    if (requester.role !== 'ADMIN') {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }
  }

  /**
   * Entrada: foundation: entidad con relaciones; requester: usuario autenticado opcional.
   * Proceso: Permite ver fundaciones VERIFIED al publico; otras solo admin u owner.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertCanViewFoundation(
    foundation: FoundationWithRelations,
    requester?: RequesterContext,
  ): void {
    if (foundation.status === FoundationStatus.VERIFIED) {
      return;
    }

    if (requester?.role === 'ADMIN') {
      return;
    }

    if (requester?.id === foundation.userId) {
      return;
    }

    throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_PUBLIC, 403);
  }

  /**
   * Entrada: foundation: entidad con relaciones; requester: usuario autenticado.
   * Proceso: Permite gestionar perfil al owner o a un administrador.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertCanManageFoundation(
    foundation: FoundationWithRelations,
    requester: RequesterContext,
  ): void {
    if (requester.role === 'ADMIN' || requester.id === foundation.userId) {
      return;
    }

    throw new AppError(API_MESSAGES.FOUNDATIONS_CANNOT_MANAGE_OTHERS, 403);
  }

  /**
   * Entrada: foundation: entidad con relaciones completas.
   * Proceso: Valida que el perfil cumpla requisitos minimos para verificacion admin.
   * Salida: Retorna void o lanza AppError 400 con detalle.
   */
  private assertProfileReadyForVerification(foundation: FoundationWithRelations): void {
    if (!isFoundationProfileComplete(foundation)) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_PROFILE_INCOMPLETE, 400);
    }

    if (!hasRequiredFoundationDocuments(foundation.documents)) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_DOCUMENTS_INCOMPLETE, 400);
    }
  }

  /**
   * Entrada: foundation: entidad con relaciones; requester: usuario autenticado opcional.
   * Proceso: Mapea a DTO de detalle aplicando filtros por rol.
   * Salida: Retorna FoundationDetailDto.
   */
  private toDetailResponse(
    foundation: FoundationWithRelations,
    requester?: RequesterContext,
  ): FoundationDetailDto {
    const viewer = resolveViewerContext(foundation, requester);
    return toFoundationDetail(
      foundation,
      viewer,
      isFoundationProfileComplete(foundation),
      hasRequiredFoundationDocuments(foundation.documents),
    );
  }
}

export const foundationsService = new FoundationsService();

export { REQUIRED_FOUNDATION_DOCUMENT_TYPES };

