import { DonationStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import {
  isFoundationOperationalReady,
} from '../foundations/foundation-profile.util.js';
import { foundationsRepository } from '../foundations/foundations.repository.js';
import { foundationBranchesRepository } from '../foundations/foundation-branches.repository.js';
import type {
  CreateDonationDto,
  CreateMessageDto,
  DonationDto,
  ListDonationsQueryDto,
  ListMessagesQueryDto,
  MessageDto,
  UpdateDonationStatusDto,
} from './donations.dto.js';
import {
  CampaignStatus,
  donationsRepository,
  FoundationStatus,
  type DonationWithRelations,
} from './donations.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';

type RequesterContext = {
  id: string;
  email: string;
  role: string;
};

const ALLOWED_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  [DonationStatus.COMMITTED]: [DonationStatus.RECEIVED, DonationStatus.CANCELLED],
  [DonationStatus.RECEIVED]: [],
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
      need,
      input,
    );

    await this.safeNotify(() =>
      notificationsService.notifyDonationCreated({
        foundationUserId: need.campaign.foundation.userId,
        donationId: created.id,
        campaignTitle: need.campaign.title,
        donorName: created.donor.fullName,
      }),
    );

    if (input.initialMessage?.trim()) {
      await this.safeNotify(() =>
        notificationsService.notifyDonationMessage({
          recipientUserId: need.campaign.foundation.userId,
          donationId: created.id,
          senderName: created.donor.fullName,
          linkPath: `/foundation/messages/${created.id}`,
        }),
      );
    }

    return await this.toDto(created, { id: donorUserId, email: '', role: 'USER' });
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
    const requester = { id: donorUserId, email: '', role: 'USER' };

    return {
      data: {
        items: await Promise.all(items.map((item) => this.toDto(item, requester))),
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
   * Entrada: foundationId: fundacion operativa; query: paginacion y filtros.
   * Proceso: Lista solicitudes de donacion recibidas por la fundacion.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listFoundationRequests(
    foundationId: string,
    query: ListDonationsQueryDto,
    foundationUserId: string,
  ): Promise<{ data: { items: DonationDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await donationsRepository.findByFoundationPaginated(
      foundationId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: await Promise.all(
          items.map((item) =>
            this.toDto(item, { id: foundationUserId, email: '', role: 'FOUNDATION' }),
          ),
        ),
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
   * Entrada: id: identificador; requester: usuario autenticado.
   * Proceso: Permite acceso al donante o a la fundacion duena de la campana.
   * Salida: Retorna el DTO o lanza AppError.
   */
  async getById(id: string, requester: RequesterContext): Promise<DonationDto> {
    const donation = await this.requireDonation(id);
    this.assertCanAccessDonation(donation, requester);
    return await this.toDto(donation, requester);
  }

  /**
   * Entrada: donationId: identificador; requester: usuario autenticado.
   * Proceso: Marca como leidos los mensajes de la conversacion para el participante.
   * Salida: Retorna void.
   */
  async markMessagesAsRead(donationId: string, requester: RequesterContext): Promise<void> {
    const donation = await this.requireDonation(donationId);
    this.assertCanAccessDonation(donation, requester);

    const conversationId =
      donation.conversation?.id ??
      (await donationsRepository.ensureConversationByDonationId(donationId));

    const foundationUserId = donation.need.campaign.foundation.userId;
    const readerRole =
      requester.id === donation.donorUserId
        ? 'donor'
        : requester.id === foundationUserId
          ? 'foundation'
          : null;

    if (!readerRole) {
      throw new AppError(API_MESSAGES.MESSAGES_CANNOT_ACCESS, 403);
    }

    await donationsRepository.markConversationAsRead(conversationId, readerRole);
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

    if (donation.status === input.status) {
      if (donation.status === DonationStatus.RECEIVED) {
        throw new AppError(API_MESSAGES.DONATIONS_ALREADY_RECEIVED, 400);
      }
      return await this.toDto(donation, requester);
    }

    if (isFoundationOwner) {
      await this.assertFoundationOperational(requester.id);
      this.assertFoundationStatusTransition(donation.status, input.status);
    } else {
      this.assertDonorStatusTransition(donation.status, input.status);
    }

    let updated: DonationWithRelations;

    if (input.status === DonationStatus.RECEIVED) {
      const receivedQuantity = input.receivedQuantity ?? donation.quantity;

      if (receivedQuantity < 1) {
        throw new AppError(API_MESSAGES.DONATIONS_RECEIVED_QUANTITY_INVALID, 400);
      }

      updated = await donationsRepository.confirmReceptionWithInventory(
        donation,
        receivedQuantity,
        input.receptionNotes ?? null,
        requester.id,
      );
    } else {
      updated = await donationsRepository.updateStatusWithHistory(
        donation.id,
        donation.needId,
        donation.quantity,
        donation.status,
        input.status,
        requester.id,
      );
    }

    const recipientUserId = isDonor
      ? foundationUserId
      : donation.donorUserId;
    const linkPath = isDonor
      ? `/foundation/requests/${donation.id}`
      : `/my-donations/${donation.id}`;

    await this.safeNotify(() =>
      notificationsService.notifyDonationStatusChanged({
        recipientUserId,
        donationId: donation.id,
        status: input.status,
        linkPath,
      }),
    );

    return await this.toDto(updated, requester);
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
      (await donationsRepository.ensureConversationByDonationId(donationId));

    const { items, total } = await donationsRepository.findMessagesPaginated(
      conversationId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    await this.markMessagesAsRead(donationId, requester);

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
      (await donationsRepository.ensureConversationByDonationId(donationId));

    await this.assertCanSendMessage(donation, conversationId, requester);

    const message = await donationsRepository.createMessage(
      conversationId,
      requester.id,
      input.body,
    );

    const foundationUserId = donation.need.campaign.foundation.userId;
    const recipientUserId =
      requester.id === donation.donorUserId
        ? foundationUserId
        : donation.donorUserId;
    const linkPath =
      recipientUserId === foundationUserId
        ? `/foundation/messages/${donation.id}`
        : `/my-donations/chats/${donation.id}`;

    await this.safeNotify(() =>
      notificationsService.notifyDonationMessage({
        recipientUserId,
        donationId: donation.id,
        senderName: message.sender.fullName,
        linkPath,
      }),
    );

    return this.toMessageDto(message);
  }

  /**
   * Entrada: task: promesa de notificacion interna.
   * Proceso: Ejecuta la notificacion sin interrumpir el flujo principal si falla.
   * Salida: Retorna void.
   */
  private async safeNotify(task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch {
      return;
    }
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
   * Entrada: donation, conversationId y requester.
   * Proceso: Valida que la donacion permita enviar mensajes y que la fundacion solo responda.
   * Salida: Retorna void o lanza AppError.
   */
  private async assertCanSendMessage(
    donation: DonationWithRelations,
    conversationId: string,
    requester: RequesterContext,
  ): Promise<void> {
    if (donation.status === DonationStatus.CANCELLED) {
      throw new AppError(API_MESSAGES.MESSAGES_DONATION_CANCELLED, 400);
    }

    const foundationUserId = donation.need.campaign.foundation.userId;

    if (requester.id === foundationUserId) {
      await this.assertFoundationOperational(foundationUserId);

      const donorMessageCount = await donationsRepository.countDonorMessages(
        conversationId,
        donation.donorUserId,
      );

      if (donorMessageCount === 0) {
        throw new AppError(API_MESSAGES.MESSAGES_FOUNDATION_CANNOT_INITIATE, 403);
      }
    }
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

    const branches = await foundationBranchesRepository.findByFoundationId(foundation.id);

    if (!isFoundationOperationalReady(foundation, foundation.documents, branches)) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_ACCESS_VERIFICATION_REQUIRED, 403);
    }
  }

  /**
   * Entrada: donation: entidad con relaciones; requester: usuario autenticado opcional.
   * Proceso: Mapea la entidad Prisma al DTO de respuesta con resumen de conversacion.
   * Salida: Retorna DonationDto.
   */
  private async toDto(
    donation: DonationWithRelations,
    requester?: RequesterContext,
  ): Promise<DonationDto> {
    const foundationUserId = donation.need.campaign.foundation.userId;
    const conversation = donation.conversation;
    let unreadCount = 0;

    if (requester && conversation) {
      const isDonor = requester.id === donation.donorUserId;
      const isFoundation = requester.id === foundationUserId;

      if (isDonor || isFoundation) {
        const lastReadAt = isDonor
          ? conversation.donorLastReadAt
          : conversation.foundationLastReadAt;

        unreadCount = await donationsRepository.countUnreadMessages(
          conversation.id,
          requester.id,
          lastReadAt,
        );
      }
    }

    return {
      id: donation.id,
      needId: donation.needId,
      donorUserId: donation.donorUserId,
      foundationBranchId: donation.foundationBranchId,
      status: donation.status,
      quantity: donation.quantity,
      receivedQuantity: donation.receivedQuantity,
      notes: donation.notes,
      estimatedDeliveryAt: donation.estimatedDeliveryAt?.toISOString() ?? null,
      receivedAt: donation.receivedAt?.toISOString() ?? null,
      receptionNotes: donation.receptionNotes,
      createdAt: donation.createdAt.toISOString(),
      updatedAt: donation.updatedAt.toISOString(),
      conversationId: conversation?.id ?? null,
      conversation: conversation
        ? {
            lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
            lastMessageBody: conversation.lastMessageBody,
            lastMessageSenderId: conversation.lastMessageSenderId,
            unreadCount,
          }
        : null,
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
      foundation: {
        id: donation.need.campaign.foundation.id,
        name: donation.need.campaign.foundation.name,
        acronym: donation.need.campaign.foundation.acronym,
        logoUrl: donation.need.campaign.foundation.logoUrl,
      },
      branch: {
        id: donation.foundationBranch.id,
        name: donation.foundationBranch.name,
        department: donation.foundationBranch.department,
        city: donation.foundationBranch.city,
        address: donation.foundationBranch.address,
        reference: donation.foundationBranch.reference,
        phone: donation.foundationBranch.phone,
        openingHours: donation.foundationBranch.openingHours,
        latitude: donation.foundationBranch.latitude,
        longitude: donation.foundationBranch.longitude,
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
