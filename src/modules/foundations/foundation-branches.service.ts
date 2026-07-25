import { FoundationBranchStatus } from '@prisma/client';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { AppError } from '../../shared/errors/app.error.js';
import { resolveCoordinatesForPersist } from '../locations/resolve-coordinates.util.js';
import { campaignsRepository } from '../campaigns/campaigns.repository.js';
import type {
  CreateFoundationBranchDto,
  FoundationBranchDto,
  UpdateFoundationBranchDto,
} from './foundation-branches.dto.js';
import {
  foundationBranchesRepository,
  toFoundationBranchDto,
} from './foundation-branches.repository.js';
import { isFoundationBranchComplete } from './foundation-profile.util.js';
import { foundationsRepository } from './foundations.repository.js';

interface RequesterContext {
  id: string;
  role: string;
}

export class FoundationBranchesService {
  /**
   * Entrada: requester: usuario autenticado con rol FOUNDATION.
   * Proceso: Obtiene la fundacion del usuario y lista sus sedes.
   * Salida: Retorna arreglo de sedes.
   */
  async listMine(requester: RequesterContext): Promise<FoundationBranchDto[]> {
    const foundation = await this.requireMyFoundation(requester);
    const branches = await foundationBranchesRepository.findByFoundationId(foundation.id);
    return branches.map(toFoundationBranchDto);
  }

  /**
   * Entrada: input: datos de sede; requester: fundacion autenticada.
   * Proceso: Crea sede con geocodificacion opcional.
   * Salida: Retorna sede creada.
   */
  async create(
    input: CreateFoundationBranchDto,
    requester: RequesterContext,
  ): Promise<FoundationBranchDto> {
    const foundation = await this.requireMyFoundation(requester);

    const resolvedCoords = await resolveCoordinatesForPersist({
      currentLatitude: null,
      currentLongitude: null,
      incomingLatitude: input.latitude,
      incomingLongitude: input.longitude,
      locationChanged: true,
      location: {
        street: input.address,
        city: input.city,
        state: input.department,
        country: foundation.country,
      },
    });

    const created = await foundationBranchesRepository.create(foundation.id, {
      ...input,
      latitude: resolvedCoords.latitude,
      longitude: resolvedCoords.longitude,
    });

    return toFoundationBranchDto(created);
  }

  /**
   * Entrada: branchId, input y requester de fundacion.
   * Proceso: Actualiza sede validando pertenencia y sedes activas minimas.
   * Salida: Retorna sede actualizada.
   */
  async update(
    branchId: string,
    input: UpdateFoundationBranchDto,
    requester: RequesterContext,
  ): Promise<FoundationBranchDto> {
    const foundation = await this.requireMyFoundation(requester);
    const existing = await foundationBranchesRepository.findByIdForFoundation(
      foundation.id,
      branchId,
    );

    if (!existing) {
      throw new AppError(API_MESSAGES.BRANCHES_NOT_FOUND, 404);
    }

    if (
      input.status === FoundationBranchStatus.INACTIVE &&
      existing.status === FoundationBranchStatus.ACTIVE
    ) {
      await this.assertCanDeactivate(foundation.id, existing.id);
    }

    const locationChanged =
      (input.department !== undefined && input.department !== existing.department) ||
      (input.city !== undefined && input.city !== existing.city) ||
      (input.address !== undefined && input.address !== existing.address);

    const resolvedCoords = await resolveCoordinatesForPersist({
      currentLatitude: existing.latitude,
      currentLongitude: existing.longitude,
      incomingLatitude: input.latitude,
      incomingLongitude: input.longitude,
      locationChanged,
      location: {
        street: input.address !== undefined ? input.address : existing.address,
        city: input.city !== undefined ? input.city : existing.city,
        state: input.department !== undefined ? input.department : existing.department,
        country: foundation.country,
      },
    });

    const updated = await foundationBranchesRepository.update(branchId, {
      ...input,
      latitude: resolvedCoords.latitude,
      longitude: resolvedCoords.longitude,
    });

    const deliveryFieldsChanged =
      input.department !== undefined ||
      input.city !== undefined ||
      input.address !== undefined ||
      input.latitude !== undefined ||
      input.longitude !== undefined;

    if (deliveryFieldsChanged) {
      await campaignsRepository.syncDeliverySnapshotFromBranch(updated);
    }

    return toFoundationBranchDto(updated);
  }

  /**
   * Entrada: branchId y requester de fundacion.
   * Proceso: Reactiva una sede inactiva de la fundacion.
   * Salida: Retorna sede reactivada.
   */
  async activate(branchId: string, requester: RequesterContext): Promise<FoundationBranchDto> {
    const foundation = await this.requireMyFoundation(requester);
    const existing = await foundationBranchesRepository.findByIdForFoundation(
      foundation.id,
      branchId,
    );

    if (!existing) {
      throw new AppError(API_MESSAGES.BRANCHES_NOT_FOUND, 404);
    }

    if (existing.status === FoundationBranchStatus.ACTIVE) {
      return toFoundationBranchDto(existing);
    }

    const updated = await foundationBranchesRepository.update(branchId, {
      status: FoundationBranchStatus.ACTIVE,
    });

    return toFoundationBranchDto(updated);
  }

  /**
   * Entrada: branchId y requester de fundacion.
   * Proceso: Marca la sede como inactiva si no es la ultima activa.
   * Salida: Retorna sede inactivada.
   */
  async deactivate(branchId: string, requester: RequesterContext): Promise<FoundationBranchDto> {
    const foundation = await this.requireMyFoundation(requester);
    const existing = await foundationBranchesRepository.findByIdForFoundation(
      foundation.id,
      branchId,
    );

    if (!existing) {
      throw new AppError(API_MESSAGES.BRANCHES_NOT_FOUND, 404);
    }

    if (existing.status === FoundationBranchStatus.INACTIVE) {
      return toFoundationBranchDto(existing);
    }

    await this.assertCanDeactivate(foundation.id, existing.id);

    const updated = await foundationBranchesRepository.deactivate(branchId);
    return toFoundationBranchDto(updated);
  }

  /**
   * Entrada: requester: usuario autenticado.
   * Proceso: Resuelve la fundacion propia del usuario FOUNDATION.
   * Salida: Retorna entidad foundation minima.
   */
  private async requireMyFoundation(requester: RequesterContext) {
    if (requester.role !== 'FOUNDATION') {
      throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
    }

    const foundation = await foundationsRepository.findByUserId(requester.id);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    return foundation;
  }

  /**
   * Entrada: foundationId y branchId candidata a desactivar.
   * Proceso: Impide dejar la fundacion sin sedes activas.
   * Salida: Retorna void o lanza AppError.
   */
  private async assertCanDeactivate(foundationId: string, branchId: string): Promise<void> {
    const publishedCampaigns =
      await foundationBranchesRepository.countPublishedCampaignsByBranchId(branchId);

    if (publishedCampaigns > 0) {
      throw new AppError(API_MESSAGES.BRANCHES_HAS_PUBLISHED_CAMPAIGNS, 400);
    }

    const activeCount = await foundationBranchesRepository.countActiveByFoundationId(foundationId);

    if (activeCount <= 1) {
      const onlyBranch = await foundationBranchesRepository.findByIdForFoundation(
        foundationId,
        branchId,
      );

      if (onlyBranch?.status === FoundationBranchStatus.ACTIVE) {
        throw new AppError(API_MESSAGES.BRANCHES_LAST_ACTIVE, 400);
      }
    }
  }

  /**
   * Entrada: foundationId y datos de perfil con ubicacion/contacto.
   * Proceso: Rellena placeholders de la sede principal desde el perfil de la fundacion.
   * Salida: Retorna void.
   */
  async syncPrimaryBranchFromFoundationProfile(
    foundationId: string,
    profile: {
      department?: string | null;
      city?: string | null;
      address?: string | null;
      phone?: string | null;
    },
  ): Promise<void> {
    const branch = await foundationBranchesRepository.findPrimaryByFoundationId(foundationId);

    if (!branch) {
      return;
    }

    const placeholders = new Set(['por completar', 'por definir']);

    const isPlaceholder = (value: string | null | undefined) => {
      const normalized = value?.trim().toLowerCase() ?? '';
      return normalized.length === 0 || placeholders.has(normalized);
    };

    const patch: {
      department?: string;
      city?: string;
      address?: string;
      phone?: string;
      status?: FoundationBranchStatus;
    } = {};

    if (profile.department?.trim() && isPlaceholder(branch.department)) {
      patch.department = profile.department.trim();
    }
    if (profile.city?.trim() && isPlaceholder(branch.city)) {
      patch.city = profile.city.trim();
    }
    if (profile.address?.trim() && isPlaceholder(branch.address)) {
      patch.address = profile.address.trim();
    }
    if (profile.phone?.trim() && isPlaceholder(branch.phone)) {
      patch.phone = profile.phone.trim();
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    const updated = await foundationBranchesRepository.updatePrimaryBranch(branch.id, patch);

    if (isFoundationBranchComplete(updated)) {
      await foundationBranchesRepository.updatePrimaryBranch(branch.id, {
        status: FoundationBranchStatus.ACTIVE,
      });
    }
  }
}

export const foundationBranchesService = new FoundationBranchesService();
