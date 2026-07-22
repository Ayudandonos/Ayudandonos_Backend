import { impactRepository } from './impact.repository.js';

export interface ImpactStatsDto {
  verifiedFoundations: number;
  activeDonors: number;
  registeredDonations: number;
  confirmedDeliveryRatePercent: number;
}

export class ImpactService {
  /**
   * Entrada: Ninguna.
   * Proceso: Agrega contadores publicos reales de impacto desde la base de datos.
   * Salida: Retorna el DTO de estadisticas de impacto.
   */
  async getPublicStats(): Promise<ImpactStatsDto> {
    const [
      verifiedFoundations,
      activeDonors,
      registeredDonations,
      confirmedDeliveries,
    ] = await Promise.all([
      impactRepository.countVerifiedFoundations(),
      impactRepository.countActiveDonors(),
      impactRepository.countRegisteredDonations(),
      impactRepository.countConfirmedDeliveries(),
    ]);

    const confirmedDeliveryRatePercent =
      registeredDonations > 0
        ? Math.round((confirmedDeliveries / registeredDonations) * 100)
        : 0;

    return {
      verifiedFoundations,
      activeDonors,
      registeredDonations,
      confirmedDeliveryRatePercent,
    };
  }
}

export const impactService = new ImpactService();
