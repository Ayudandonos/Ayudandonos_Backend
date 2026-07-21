import { DonationStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import {
  isFoundationOperationalReady,
} from '../foundations/foundation-profile.util.js';
import { foundationsRepository } from '../foundations/foundations.repository.js';
import type {
  CreateDonationDto,
  CreateMessageDto,
  DonationDto,
  ListDonationsQueryDto,
  ListMessagesQueryDto,
  MessageDto,
  UpdateDonationDeliveryDto,
  UpdateDonationStatusDto,
} from './donations.dto.js';
import {
  CampaignStatus,
  donationsRepository,
  FoundationStatus,
  type DonationWithRelations,
} from './donations.repository.js';

type RequesterContext = {
  id: string;
  email: string;
  role: string;
};

const ALLOWED_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  [DonationStatus.COMMITTED]: [DonationStatus.IN_TRANSIT, DonationStatus.CANCELLED],
  [DonationStatus.IN_TRANSIT]: [DonationStatus.DELIVERED, DonationStatus.CANCELLED],
  [DonationStatus.DELIVERED]: [DonationStatus.CONFIRMED],
  [DonationStatus.CONFIRMED]: [],
  [DonationStatus.CANCELLED]: [],
};

export class DonationsService {
  /**
   * Entrada: input: datos del compromiso; donorUserId: usuario donante autenticado.
   * Proceso: Valida necesidad y campana; crea donacion, historial y conversacion.
   * Salida: Retorna el DTO de la donacion creada.
   */
  async create(input: CreateDonationDto, donorUserId: string): Promise<DonationDto> {
    const need = await donationsRepository.findNeedForDonation(input.needId);

    if (!need) {
      throw new AppError(API_MESSAGES.DONATIONS_NEED_NOT_AVAILABLE, 400);
    }

    if (
      need.campaign.deletedAt ||
      need.campaign.status !== CampaignStatus.PUBLISHED ||
      need.campaign.foundation.deletedAt ||
      need.campaign.foundation.status !== FoundationStatus.VERIFIED
    ) {
      throw new AppError(API_MESSAGES.DONATIONS_NEED_NOT_AVAILABLE, 400);
    }

    const pending = need.quantity - need.fulfilledQuantity;

    if (input.quantity > pending) {
      throw new AppError(API_MESSAGES.DONATIONS_QUANTITY_EXCEEDS, 400);
    }

    const created = await donationsRepository.createWithConversationAndHistory(
      donorUserId,
      need.id,
      input,
    );

    return this.toDto(created);
  }

  /**
   * Entrada: query: paginacion; donorUserId: usuario donante.
   * Proceso: Lista donaciones del donante autenticado.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listMine(
    query: ListDonationsQueryDto,
    donorUserId: string,
  ): Promise<{ data: { items: DonationDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await donationsRepository.findByDonorPaginated(
      donorUserId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((item) => this.toDto(item)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: foundationId: fundacion operativa; query: paginacion y filtros.
   * Proceso: Lista solicitudes de donacion recibidas por la fundacion.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listFoundationRequests(
    foundationId: string,
    query: ListDonationsQueryDto,
  ): Promise<{ data: { items: DonationDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await donationsRepository.findByFoundationPaginated(
      foundationId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((item) => this.toDto(item)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: id: identificador; requester: usuario autenticado.
   * Proceso: Permite acceso al donante o a la fundacion duena de la campana.
   * Salida: Retorna el DTO o lanza AppError.
   */
  async getById(id: string, requester: RequesterContext): Promise<DonationDto> {
    const donation = await this.requireDonation(id);
    this.assertCanAccessDonation(donation, requester);
    return this.toDto(donation);
  }

  /**
   * Entrada: id: identificador; input: nuevo estado; requester: usuario autenticado.
   * Proceso: Valida rol y transicion; persiste historial y ajusta cantidades si cancela.
   * Salida: Retorna el DTO actualizado.
   */
  async updateStatus(
    id: string,
    input: UpdateDonationStatusDto,
    requester: RequesterContext,
  ): Promise<DonationDto> {
    const donation = await this.requireDonation(id);
    const foundationUserId = donation.need.campaign.foundation.userId;
    const isDonor = donation.donorUserId === requester.id;
    const isFoundationOwner =
      requester.role === 'FOUNDATION' && requester.id === foundationUserId;

    if (!isDonor && !isFoundationOwner) {
      throw new AppError(API_MESSAGES.DONATIONS_CANNOT_MANAGE, 403);
    }

    if (isFoundationOwner) {
      await this.assertFoundationOperational(requester.id);
      this.assertFoundationStatusTransition(donation.status, input.status);
    } else {
      this.assertDonorStatusTransition(donation.status, input.status);
    }

    if (donation.status === input.status) {
      return this.toDto(donation);
    }

    const updated = await donationsRepository.updateStatusWithHistory(
      donation.id,
      donation.needId,
      donation.quantity,
      donation.status,
      input.status,
      requester.id,
    );

    return this.toDto(updated);
  }

  /**
   * Entrada: id: identificador; input: datos de entrega; foundationUserId: dueno operativo.
   * Proceso: Actualiza entrega solo si la fundacion es duena de la campana.
   * Salida: Retorna el DTO actualizado.
   */
  async updateDelivery(
    id: string,
    input: UpdateDonationDeliveryDto,
    foundationUserId: string,
    foundationId: string,
  ): Promise<DonationDto> {
    const donation = await this.requireDonation(id);

    if (donation.need.campaign.foundationId !== foundationId) {
      throw new AppError(API_MESSAGES.DONATIONS_CANNOT_MANAGE, 403);
    }

    if (donation.need.campaign.foundation.userId !== foundationUserId) {
      throw new AppError(API_MESSAGES.DONATIONS_CANNOT_MANAGE, 403);
    }

    const updated = await donationsRepository.updateDelivery(id, input);
    return this.toDto(updated);
  }

  /**
   * Entrada: donationId: identificador; query: paginacion; requester: usuario autenticado.
   * Proceso: Lista mensajes si el usuario es participante de la conversacion.
   * Salida: Retorna mensajes y meta de paginacion.
   */
  async listMessages(
    donationId: string,
    query: ListMessagesQueryDto,
    requester: RequesterContext,
  ): Promise<{ data: { items: MessageDto[] }; meta: ApiResponseMeta }> {
    const donation = await this.requireDonation(donationId);
    this.assertCanAccessDonation(donation, requester);

    const conversationId =
      donation.conversation?.id ??
      (await donationsRepository.findConversationIdByDonationId(donationId));

    if (!conversationId) {
      throw new AppError(API_MESSAGES.MESSAGES_CONVERSATION_NOT_FOUND, 404);
    }

    const { items, total } = await donationsRepository.findMessagesPaginated(
      conversationId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: items.map((message) => this.toMessageDto(message)),
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
   * Entrada: donationId: identificador; input: cuerpo del mensaje; requester: remitente.
   * Proceso: Crea mensaje si el usuario es participante de la donacion.
   * Salida: Retorna el DTO del mensaje creado.
   */
  async createMessage(
    donationId: string,
    input: CreateMessageDto,
    requester: RequesterContext,
  ): Promise<MessageDto> {
    const donation = await this.requireDonation(donationId);
    this.assertCanAccessDonation(donation, requester);

    const conversationId =
      donation.conversation?.id ??
      (await donationsRepository.findConversationIdByDonationId(donationId));

    if (!conversationId) {
      throw new AppError(API_MESSAGES.MESSAGES_CONVERSATION_NOT_FOUND, 404);
    }

    const message = await donationsRepository.createMessage(
      conversationId,
      requester.id,
      input.body,
    );

    return this.toMessageDto(message);
  }

  /**
   * Entrada: id: identificador de donacion.
   * Proceso: Carga la donacion o responde 404.
   * Salida: Retorna la entidad con relaciones.
   */
  private async requireDonation(id: string): Promise<DonationWithRelations> {
    const donation = await donationsRepository.findById(id);

    if (!donation) {
      throw new AppError(API_MESSAGES.DONATIONS_NOT_FOUND, 404);
    }

    return donation;
  }

  /**
   * Entrada: donation: entidad; requester: usuario autenticado.
   * Proceso: Verifica donante o fundacion duena de la campana.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertCanAccessDonation(
    donation: DonationWithRelations,
    requester: RequesterContext,
  ): void {
    if (donation.donorUserId === requester.id) {
      return;
    }

    if (
      requester.role === 'FOUNDATION' &&
      requester.id === donation.need.campaign.foundation.userId
    ) {
      return;
    }

    throw new AppError(API_MESSAGES.DONATIONS_CANNOT_ACCESS, 403);
  }

  /**
   * Entrada: foundationUserId: usuario de la fundacion.
   * Proceso: Exige fundacion verificada y operativa para gestionar estados.
   * Salida: Retorna void o lanza AppError 403.
   */
  private async assertFoundationOperational(foundationUserId: string): Promise<void> {
    const foundation = await foundationsRepository.findByUserId(foundationUserId);

    if (!foundation || !foundation.user.isActive) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    if (!isFoundationOperationalReady(foundation, foundation.documents)) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_ACCESS_VERIFICATION_REQUIRED, 403);
    }
  }

  /**
   * Entrada: from/to: estados de la donacion.
   * Proceso: Valida transicion permitida para la fundacion operativa.
   * Salida: Retorna void o lanza AppError 400.
   */
  private assertFoundationStatusTransition(
    from: DonationStatus,
    to: DonationStatus,
  ): void {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new AppError(API_MESSAGES.DONATIONS_INVALID_STATUS_TRANSITION, 400);
    }
  }

  /**
   * Entrada: from/to: estados de la donacion.
   * Proceso: El donante solo puede cancelar desde COMMITTED.
   * Salida: Retorna void o lanza AppError 400/403.
   */
  private assertDonorStatusTransition(from: DonationStatus, to: DonationStatus): void {
    if (from === DonationStatus.COMMITTED && to === DonationStatus.CANCELLED) {
      return;
    }

    throw new AppError(API_MESSAGES.DONATIONS_INVALID_STATUS_TRANSITION, 400);
  }

  /**
   * Entrada: donation: entidad con relaciones.
   * Proceso: Mapea la entidad Prisma al DTO de respuesta.
   * Salida: Retorna DonationDto.
   */
  private toDto(donation: DonationWithRelations): DonationDto {
    return {
      id: donation.id,
      needId: donation.needId,
      donorUserId: donation.donorUserId,
      status: donation.status,
      quantity: donation.quantity,
      notes: donation.notes,
      estimatedDeliveryAt: donation.estimatedDeliveryAt?.toISOString() ?? null,
      deliveryAddress: donation.deliveryAddress,
      deliveryLatitude: donation.deliveryLatitude,
      deliveryLongitude: donation.deliveryLongitude,
      createdAt: donation.createdAt.toISOString(),
      updatedAt: donation.updatedAt.toISOString(),
      conversationId: donation.conversation?.id ?? null,
      need: {
        id: donation.need.id,
        name: donation.need.name,
        unit: donation.need.unit,
        quantity: donation.need.quantity,
        fulfilledQuantity: donation.need.fulfilledQuantity,
      },
      campaign: {
        id: donation.need.campaign.id,
        title: donation.need.campaign.title,
        status: donation.need.campaign.status,
      },
      donor: {
        id: donation.donor.id,
        fullName: donation.donor.fullName,
      },
      statusHistory: donation.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedById: entry.changedById,
        changedByFullName: entry.changedBy?.fullName ?? null,
        note: entry.note,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Entrada: message: entidad con remitente.
   * Proceso: Mapea el mensaje al DTO de respuesta.
   * Salida: Retorna MessageDto.
   */
  private toMessageDto(
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      body: string;
      createdAt: Date;
      sender: { id: string; fullName: string };
    },
  ): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderFullName: message.sender.fullName,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

export const donationsService = new DonationsService();
