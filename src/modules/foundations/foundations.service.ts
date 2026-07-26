import { FoundationDocumentType, FoundationStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { mapUnknownError } from '../../shared/errors/map-unknown-error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { deleteStoredFile, resolveDocumentFile, saveFoundationFile } from '../../shared/utils/upload.util.js';
import {
  getMissingFoundationProfileFields,
  hasRequiredFoundationDocuments,
  hasActiveFoundationBranch,
  isFoundationProfileComplete,
  pickBranchLocationForFoundationProfile,
  REQUIRED_FOUNDATION_DOCUMENT_TYPES,
} from './foundation-profile.util.js';
import type {
  FoundationDetailDto,
  FoundationPublicBranchDto,
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
import { foundationBranchesService } from './foundation-branches.service.js';
import {
  foundationBranchesRepository,
} from './foundation-branches.repository.js';
import {
  boundingBoxForRadius,
  haversineDistanceKm,
} from '../../shared/utils/geo.util.js';
import { resolveCoordinatesForPersist } from '../locations/resolve-coordinates.util.js';

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
    const branchCandidates =
      await foundationBranchesRepository.findActiveVerifiedInBoundingBox(box);

    const foundationMap = new Map<
      string,
      {
        id: string;
        name: string;
        acronym: string | null;
        category: string | null;
        logoUrl: string | null;
        city: string;
        latitude: number;
        longitude: number;
        distanceKm: number;
      }
    >();

    for (const branch of branchCandidates) {
      if (branch.latitude === null || branch.longitude === null) {
        continue;
      }

      const distanceKm = haversineDistanceKm(origin, {
        latitude: branch.latitude,
        longitude: branch.longitude,
      });

      if (distanceKm > query.radiusKm) {
        continue;
      }

      const roundedDistance = Math.round(distanceKm * 100) / 100;
      const existing = foundationMap.get(branch.foundation.id);

      if (!existing || roundedDistance < existing.distanceKm) {
        foundationMap.set(branch.foundation.id, {
          id: branch.foundation.id,
          name: branch.foundation.name,
          acronym: branch.foundation.acronym,
          category: branch.foundation.category,
          logoUrl: branch.foundation.logoUrl,
          city: branch.city,
          latitude: branch.latitude,
          longitude: branch.longitude,
          distanceKm: roundedDistance,
        });
      }
    }

    const items = Array.from(foundationMap.values()).sort(
      (a, b) => a.distanceKm - b.distanceKm,
    );

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
   * Entrada: id: identificador de fundacion verificada.
   * Proceso: Lista sedes activas visibles en perfil publico.
   * Salida: Retorna arreglo de sedes publicas.
   */
  async listPublicBranches(
    id: string,
    requester?: RequesterContext,
  ): Promise<FoundationPublicBranchDto[]> {
    const foundation = await foundationsRepository.findByIdWithRelations(id);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    this.assertCanViewFoundation(foundation, requester);

    const branches = await foundationBranchesRepository.findActivePublicByFoundationId(id);

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      department: branch.department,
      city: branch.city,
      address: branch.address,
      reference: branch.reference,
      phone: branch.phone,
      openingHours: branch.openingHours,
      latitude: branch.latitude,
      longitude: branch.longitude,
    }));
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

      const locationChanged =
        (input.country !== undefined && input.country !== foundation.country) ||
        (input.department !== undefined && input.department !== foundation.department) ||
        (input.city !== undefined && input.city !== foundation.city) ||
        (input.address !== undefined && input.address !== foundation.address);

      const resolvedCoords = await resolveCoordinatesForPersist({
        currentLatitude: foundation.latitude,
        currentLongitude: foundation.longitude,
        incomingLatitude: input.latitude,
        incomingLongitude: input.longitude,
        locationChanged,
        location: {
          street: input.address !== undefined ? input.address : foundation.address,
          city: input.city !== undefined ? input.city : foundation.city,
          state:
            input.department !== undefined ? input.department : foundation.department,
          country: input.country !== undefined ? input.country : foundation.country,
        },
      });

      profileData.latitude = resolvedCoords.latitude;
      profileData.longitude = resolvedCoords.longitude;

      const updated = await foundationsRepository.updateProfileWithSocialLinks(
        id,
        profileData,
        socialLinks,
      );

      await foundationBranchesService.syncPrimaryBranchFromFoundationProfile(updated.id, {
        department: updated.department,
        city: updated.city,
        address: updated.address,
        phone: updated.phone,
      });

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

    let foundation = await foundationsRepository.findByIdWithRelations(id);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    if (foundation.status === input.status) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_STATUS_ALREADY_SET, 400);
    }

    if (input.status === FoundationStatus.VERIFIED) {
      foundation = await this.syncProfileLocationFromBranches(foundation);
      await this.assertProfileReadyForVerification(foundation);
    }

    const updatedFoundation = await foundationsRepository.updateStatus(id, input, requester.id);
    return this.toDetailResponse(updatedFoundation, requester);
  }

  /**
   * Entrada: id: identificador; file: archivo de logo; requester: owner o admin.
   * Proceso: Reemplaza el logo de la fundacion en Blob o almacenamiento local.
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
   * Proceso: Crea o reemplaza un documento legal de la fundacion en Blob o disco.
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
   * Proceso: Valida permisos y resuelve el archivo (Blob stream o ruta local) para descarga.
   * Salida: Retorna payload de descarga del documento.
   */
  async getDocumentDownload(
    id: string,
    type: FoundationDocumentType,
    requester: RequesterContext,
  ) {
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

      return resolveDocumentFile({
        storageKey: document.fileUrl,
        fileName: document.fileName,
        mimeType: document.mimeType,
      });
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
   * Entrada: foundation: entidad con relaciones.
   * Proceso: Si faltan pais/ciudad/departamento/direccion en el perfil, los copia
   *   desde una sede activa usable y opcionalmente geocodifica.
   * Salida: Retorna la fundacion (actualizada o la original si no hubo cambios).
   */
  private async syncProfileLocationFromBranches(
    foundation: FoundationWithRelations,
  ): Promise<FoundationWithRelations> {
    const isBlank = (value: string | null | undefined): boolean =>
      !value || value.trim().length === 0;

    if (
      !isBlank(foundation.country) &&
      !isBlank(foundation.city) &&
      !isBlank(foundation.department) &&
      !isBlank(foundation.address)
    ) {
      return foundation;
    }

    const branches = await foundationBranchesRepository.findByFoundationId(foundation.id);
    const location = pickBranchLocationForFoundationProfile(branches);

    if (!location) {
      return foundation;
    }

    const profileData: {
      country?: string;
      city?: string;
      department?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
    } = {};

    if (isBlank(foundation.country)) {
      profileData.country = 'Colombia';
    }
    if (isBlank(foundation.city)) {
      profileData.city = location.city;
    }
    if (isBlank(foundation.department)) {
      profileData.department = location.department;
    }
    if (isBlank(foundation.address)) {
      profileData.address = location.address;
    }

    if (Object.keys(profileData).length === 0) {
      return foundation;
    }

    const resolvedCoords = await resolveCoordinatesForPersist({
      currentLatitude: foundation.latitude,
      currentLongitude: foundation.longitude,
      incomingLatitude: undefined,
      incomingLongitude: undefined,
      locationChanged: true,
      location: {
        street: profileData.address ?? foundation.address,
        city: profileData.city ?? foundation.city,
        state: profileData.department ?? foundation.department,
        country: profileData.country ?? foundation.country,
      },
    });

    profileData.latitude = resolvedCoords.latitude;
    profileData.longitude = resolvedCoords.longitude;

    return foundationsRepository.updateById(foundation.id, profileData);
  }

  /**
   * Entrada: foundation: entidad con relaciones completas.
   * Proceso: Valida que el perfil cumpla requisitos minimos para verificacion admin.
   * Salida: Retorna void o lanza AppError 400 con detalle de campos faltantes.
   */
  private async assertProfileReadyForVerification(
    foundation: FoundationWithRelations,
  ): Promise<void> {
    const missingFields = getMissingFoundationProfileFields(foundation);

    if (missingFields.length > 0) {
      const errors = Object.fromEntries(
        missingFields.map((field) => [field, ['Campo requerido para verificación']]),
      );
      throw new AppError(API_MESSAGES.FOUNDATIONS_PROFILE_INCOMPLETE, 400, true, errors);
    }

    if (!hasRequiredFoundationDocuments(foundation.documents)) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_DOCUMENTS_INCOMPLETE, 400);
    }

    const branches = await foundationBranchesRepository.findByFoundationId(foundation.id);

    if (!hasActiveFoundationBranch(branches)) {
      throw new AppError(API_MESSAGES.BRANCHES_REQUIRED_FOR_PROFILE, 400);
    }
  }

  /**
   * Entrada: foundation: entidad con relaciones; requester: usuario autenticado opcional.
   * Proceso: Mapea a DTO de detalle aplicando filtros por rol y sedes.
   * Salida: Retorna FoundationDetailDto.
   */
  private async toDetailResponse(
    foundation: FoundationWithRelations,
    requester?: RequesterContext,
  ): Promise<FoundationDetailDto> {
    const viewer = resolveViewerContext(foundation, requester);
    const branches = await foundationBranchesRepository.findByFoundationId(foundation.id);

    return toFoundationDetail(
      foundation,
      viewer,
      isFoundationProfileComplete(foundation),
      hasRequiredFoundationDocuments(foundation.documents),
      branches,
      hasActiveFoundationBranch(branches),
    );
  }
}

export const foundationsService = new FoundationsService();

export { REQUIRED_FOUNDATION_DOCUMENT_TYPES };

