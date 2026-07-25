import { geocodingConfig } from '../../config/env.config.js';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { searchNominatim } from './geocoding.client.js';
import {
  buildFreeFormQuery,
  buildGeocodeCacheKey,
  matchesRequestedLocality,
  shouldRestrictToColombia,
  type NominatimSearchResult,
} from './geocoding.util.js';
import { locationsRepository } from './locations.repository.js';
import type {
  GeocodeQueryDto,
  GeocodeResultDto,
  LocationCityDto,
  LocationCountryDto,
  LocationStateDto,
} from './locations.dto.js';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const geocodeCache = new Map<string, CacheEntry<GeocodeResultDto>>();

/**
 * Entrada: results: candidatos Nominatim; city/state: filtros del request.
 * Proceso: Conserva solo resultados que coinciden con localidad solicitada.
 * Salida: Retorna el primer match confiable o null.
 */
function pickReliableMatch(
  results: NominatimSearchResult[],
  city?: string,
  state?: string,
): NominatimSearchResult | null {
  const filtered = results.filter((result) =>
    matchesRequestedLocality(result, city, state),
  );
  return filtered[0] ?? null;
}

/**
 * Entrada: result: candidato Nominatim seleccionado.
 * Proceso: Convierte lat/lon string a numero y arma DTO de respuesta.
 * Salida: Retorna GeocodeResultDto o null si las coords son invalidas.
 */
function toGeocodeResult(result: NominatimSearchResult): GeocodeResultDto | null {
  const latitude = Number.parseFloat(result.lat);
  const longitude = Number.parseFloat(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    displayName: result.display_name,
    provider: geocodingConfig.provider,
  };
}

/**
 * Entrada: Ninguna.
 * Proceso: Orquesta catalogo CSC y geocodificacion estructurada Nominatim.
 * Salida: Instancia de servicio de locations.
 */
export class LocationsService {
  /**
   * Entrada: Ninguna.
   * Proceso: Orquesta la obtencion de paises via repositorio (cache + CSC).
   * Salida: Retorna listado de paises normalizados.
   */
  async listCountries(): Promise<LocationCountryDto[]> {
    return locationsRepository.findCountries();
  }

  /**
   * Entrada: countryIso: codigo ISO2 del pais.
   * Proceso: Orquesta la obtencion de estados del pais.
   * Salida: Retorna listado de estados normalizados.
   */
  async listStatesByCountry(countryIso: string): Promise<LocationStateDto[]> {
    return locationsRepository.findStatesByCountry(countryIso);
  }

  /**
   * Entrada: countryIso: ISO2 pais; stateIso: ISO del estado.
   * Proceso: Orquesta la obtencion de ciudades del estado.
   * Salida: Retorna listado de ciudades normalizados.
   */
  async listCitiesByState(
    countryIso: string,
    stateIso: string,
  ): Promise<LocationCityDto[]> {
    return locationsRepository.findCitiesByState(countryIso, stateIso);
  }

  /**
   * Entrada: query: street/city/state/country/q opcionales ya validados.
   * Proceso: Busca estructurado, filtra por localidad, fallback q y cachea el resultado.
   * Salida: Retorna GeocodeResultDto o lanza AppError 404/503.
   */
  async geocode(query: GeocodeQueryDto): Promise<GeocodeResultDto> {
    const street = query.street?.trim() || undefined;
    const city = query.city?.trim() || undefined;
    const state = query.state?.trim() || undefined;
    const country = query.country?.trim() || undefined;
    const freeText = query.q?.trim() || undefined;

    const cacheKey = buildGeocodeCacheKey({ street, city, state, country, q: freeText });
    const cached = geocodeCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const countrycodes = shouldRestrictToColombia(country, city, state)
      ? 'co'
      : undefined;

    let match: NominatimSearchResult | null = null;

    if (street || city || state || country) {
      const structured = await searchNominatim({
        street,
        city,
        state,
        country,
        countrycodes,
      });
      match = pickReliableMatch(structured, city, state);
    }

    if (!match) {
      const fallbackQuery =
        freeText || buildFreeFormQuery({ street, city, state, country });

      if (fallbackQuery) {
        const freeForm = await searchNominatim({
          q: fallbackQuery,
          countrycodes,
        });
        match = pickReliableMatch(freeForm, city, state);
      }
    }

    if (!match) {
      throw new AppError(API_MESSAGES.LOCATIONS_GEOCODE_NO_MATCH, 404, true, {
        geocode: ['NO_MATCH'],
      });
    }

    const mapped = toGeocodeResult(match);

    if (!mapped) {
      throw new AppError(API_MESSAGES.LOCATIONS_GEOCODE_NO_MATCH, 404, true, {
        geocode: ['NO_MATCH'],
      });
    }

    geocodeCache.set(cacheKey, {
      value: mapped,
      expiresAt: now + geocodingConfig.cacheTtlMs,
    });

    return mapped;
  }

  /**
   * Entrada: query: mismos campos del endpoint geocode.
   * Proceso: Intenta geocodificar sin tumbar flujos de persistencia.
   * Salida: Retorna resultado o null si no hay match o el proveedor fallo.
   */
  async tryGeocode(query: GeocodeQueryDto): Promise<GeocodeResultDto | null> {
    try {
      if (!query.city && !query.state && !(query.street && query.country) && !query.q) {
        return null;
      }

      if (query.street && !query.city && !query.state) {
        return null;
      }

      return await this.geocode(query);
    } catch {
      return null;
    }
  }
}

export const locationsService = new LocationsService();
