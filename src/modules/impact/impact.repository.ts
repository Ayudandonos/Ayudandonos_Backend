import { DonationStatus, FoundationStatus, UserRole } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';

export class ImpactRepository {
  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta fundaciones con estado VERIFIED.
   * Salida: Retorna el total de organizaciones verificadas.
   */
  async countVerifiedFoundations(): Promise<number> {
    return prisma.foundation.count({
      where: { status: FoundationStatus.VERIFIED },
    });
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta usuarios activos con rol donante (USER).
   * Salida: Retorna el total de donantes registrados activos.
   */
  async countActiveDonors(): Promise<number> {
    return prisma.user.count({
      where: {
        role: UserRole.USER,
        isActive: true,
      },
    });
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta donaciones no canceladas.
   * Salida: Retorna el total de aportes registrados.
   */
  async countRegisteredDonations(): Promise<number> {
    return prisma.donation.count({
      where: {
        status: { not: DonationStatus.CANCELLED },
      },
    });
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta donaciones entregadas o confirmadas.
   * Salida: Retorna el total de entregas confirmadas.
   */
  async countConfirmedDeliveries(): Promise<number> {
    return prisma.donation.count({
      where: {
        status: {
          in: [DonationStatus.DELIVERED, DonationStatus.CONFIRMED],
        },
      },
    });
  }
}

export const impactRepository = new ImpactRepository();
