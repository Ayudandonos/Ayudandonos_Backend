import type { FoundationBranch, Prisma } from '@prisma/client';
import { FoundationBranchStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  CreateFoundationBranchDto,
  UpdateFoundationBranchDto,
} from './foundation-branches.dto.js';

/**
 * Entrada: branch: entidad Prisma de sede.
 * Proceso: Mapea campos de persistencia al DTO de API.
 * Salida: Retorna FoundationBranchDto.
 */
export function toFoundationBranchDto(branch: FoundationBranch) {
  return {
    id: branch.id,
    foundationId: branch.foundationId,
    name: branch.name,
    department: branch.department,
    city: branch.city,
    address: branch.address,
    reference: branch.reference,
    phone: branch.phone,
    openingHours: branch.openingHours,
    latitude: branch.latitude,
    longitude: branch.longitude,
    status: branch.status,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

export const foundationBranchesRepository = {
  /**
   * Entrada: foundationId: identificador de la fundacion.
   * Proceso: Lista sedes ordenadas por nombre.
   * Salida: Retorna arreglo de sedes.
   */
  async findByFoundationId(foundationId: string): Promise<FoundationBranch[]> {
    return prisma.foundationBranch.findMany({
      where: { foundationId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  },

  /**
   * Entrada: foundationId y branchId.
   * Proceso: Busca una sede de la fundacion.
   * Salida: Retorna sede o null.
   */
  async findByIdForFoundation(
    foundationId: string,
    branchId: string,
  ): Promise<FoundationBranch | null> {
    return prisma.foundationBranch.findFirst({
      where: { id: branchId, foundationId },
    });
  },

  /**
   * Entrada: foundationId: identificador de la fundacion.
   * Proceso: Cuenta sedes activas de la fundacion.
   * Salida: Retorna total de sedes activas.
   */
  async countActiveByFoundationId(foundationId: string): Promise<number> {
    return prisma.foundationBranch.count({
      where: { foundationId, status: FoundationBranchStatus.ACTIVE },
    });
  },

  /**
   * Entrada: branchId: identificador de la sede.
   * Proceso: Cuenta campanas publicadas no eliminadas asociadas a la sede.
   * Salida: Retorna total de campanas activas.
   */
  async countPublishedCampaignsByBranchId(branchId: string): Promise<number> {
    return prisma.campaign.count({
      where: {
        foundationBranchId: branchId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });
  },

  /**
   * Entrada: foundationId: identificador de la fundacion.
   * Proceso: Lista sedes activas visibles en perfil publico.
   * Salida: Retorna arreglo de sedes activas.
   */
  async findActivePublicByFoundationId(foundationId: string): Promise<FoundationBranch[]> {
    return prisma.foundationBranch.findMany({
      where: { foundationId, status: FoundationBranchStatus.ACTIVE },
      orderBy: [{ name: 'asc' }],
    });
  },

  /**
   * Entrada: box: bounding box geografico.
   * Proceso: Lista sedes activas de fundaciones verificadas con coordenadas en el box.
   * Salida: Retorna sedes con fundacion basica.
   */
  async findActiveVerifiedInBoundingBox(box: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  }): Promise<
    Array<
      FoundationBranch & {
        foundation: {
          id: string;
          name: string;
          acronym: string | null;
          category: string | null;
          logoUrl: string | null;
          status: string;
          deletedAt: Date | null;
        };
      }
    >
  > {
    return prisma.foundationBranch.findMany({
      where: {
        status: FoundationBranchStatus.ACTIVE,
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
        foundation: {
          status: 'VERIFIED',
          deletedAt: null,
          user: { isActive: true },
        },
      },
      include: {
        foundation: {
          select: {
            id: true,
            name: true,
            acronym: true,
            category: true,
            logoUrl: true,
            status: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Entrada: foundationId y datos de sede.
   * Proceso: Persiste una nueva sede de acopio.
   * Salida: Retorna la sede creada.
   */
  async create(
    foundationId: string,
    data: CreateFoundationBranchDto & { latitude: number | null; longitude: number | null },
  ): Promise<FoundationBranch> {
    return prisma.foundationBranch.create({
      data: {
        foundationId,
        name: data.name,
        department: data.department,
        city: data.city,
        address: data.address,
        reference: data.reference ?? null,
        phone: data.phone,
        openingHours: data.openingHours,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status ?? FoundationBranchStatus.ACTIVE,
      },
    });
  },

  /**
   * Entrada: branchId y payload parcial con coordenadas resueltas.
   * Proceso: Actualiza campos de la sede.
   * Salida: Retorna la sede actualizada.
   */
  async update(
    branchId: string,
    data: UpdateFoundationBranchDto & {
      latitude?: number | null;
      longitude?: number | null;
    },
  ): Promise<FoundationBranch> {
    const updateData: Prisma.FoundationBranchUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.openingHours !== undefined) updateData.openingHours = data.openingHours;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    return prisma.foundationBranch.update({
      where: { id: branchId },
      data: updateData,
    });
  },

  /**
   * Entrada: branchId: identificador de la sede.
   * Proceso: Marca la sede como inactiva.
   * Salida: Retorna la sede actualizada.
   */
  async deactivate(branchId: string): Promise<FoundationBranch> {
    return prisma.foundationBranch.update({
      where: { id: branchId },
      data: { status: FoundationBranchStatus.INACTIVE },
    });
  },

  /**
   * Entrada: foundationId: identificador de la fundacion.
   * Proceso: Busca la sede principal creada al registro.
   * Salida: Retorna la sede o null si no existe.
   */
  async findPrimaryByFoundationId(foundationId: string): Promise<FoundationBranch | null> {
    return prisma.foundationBranch.findFirst({
      where: { foundationId, name: 'Sede principal' },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Entrada: branchId y datos parciales de sede.
   * Proceso: Actualiza campos de la sede principal.
   * Salida: Retorna la sede actualizada.
   */
  async updatePrimaryBranch(
    branchId: string,
    data: Pick<Prisma.FoundationBranchUpdateInput, 'department' | 'city' | 'address' | 'phone' | 'status'>,
  ): Promise<FoundationBranch> {
    return prisma.foundationBranch.update({
      where: { id: branchId },
      data,
    });
  },
};
