import { geocodingConfig } from '../../config/env.config.js';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { NominatimSearchResult } from './geocoding.util.js';

let providerQueue: Promise<void> = Promise.resolve();
let lastProviderRequestAt = 0;

/**
 * Entrada: Ninguna.
 * Proceso: Encola la espera minima entre llamadas al proveedor ( Nominatim ~1 req/s ).
 * Salida: Resuelve cuando es seguro emitir la siguiente peticion.
 */
async function waitForProviderSlot(): Promise<void> {
  const run = async (): Promise<void> => {
    const now = Date.now();
    const waitMs = Math.max(0, geocodingConfig.minIntervalMs - (now - lastProviderRequestAt));

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    lastProviderRequestAt = Date.now();
  };

  providerQueue = providerQueue.then(run, run);
  await providerQueue;
}

export type NominatimSearchParams = {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  q?: string;
  countrycodes?: string;
};

/**
 * Entrada: params: filtros estructurados o texto libre para Nominatim.
 * Proceso: Llama al endpoint /search con User-Agent, timeout y throttle.
 * Salida: Retorna resultados tipados o lanza AppError operacional.
 */
export async function searchNominatim(
  params: NominatimSearchParams,
): Promise<NominatimSearchResult[]> {
  await waitForProviderSlot();

  const url = new URL(`${geocodingConfig.baseUrl}/search`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');

  if (params.street) {
    url.searchParams.set('street', params.street);
  }
  if (params.city) {
    url.searchParams.set('city', params.city);
  }
  if (params.state) {
    url.searchParams.set('state', params.state);
  }
  if (params.country) {
    url.searchParams.set('country', params.country);
  }
  if (params.q) {
    url.searchParams.set('q', params.q);
  }
  if (params.countrycodes) {
    url.searchParams.set('countrycodes', params.countrycodes);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), geocodingConfig.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': geocodingConfig.userAgent,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError(API_MESSAGES.LOCATIONS_GEOCODE_UNAVAILABLE, 503);
    }

    const payload = (await response.json()) as NominatimSearchResult[];
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(API_MESSAGES.LOCATIONS_GEOCODE_UNAVAILABLE, 503);
  } finally {
    clearTimeout(timeout);
  }
}
