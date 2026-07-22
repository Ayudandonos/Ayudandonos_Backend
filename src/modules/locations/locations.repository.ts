import { cscConfig } from '../../config/env.config.js';
import {
  fetchCscCities,
  fetchCscCountries,
  fetchCscStates,
} from './locations.client.js';
import type {
  CscCityRaw,
  CscCountryRaw,
  CscStateRaw,
  LocationCityDto,
  LocationCountryDto,
  LocationStateDto,
} from './locations.dto.js';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

/**
 * Entrada: Ninguna.
 * Proceso: Gestiona acceso al proveedor CSC con cache en memoria por TTL.
 * Salida: Instancia de repositorio de ubicaciones.
 */
export class LocationsRepository {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Entrada: Ninguna.
   * Proceso: Devuelve paises normalizados (cacheados si el TTL sigue vigente).
   * Salida: Retorna listado de LocationCountryDto.
   */
  async findCountries(): Promise<LocationCountryDto[]> {
    return this.getOrLoad('countries', async () => {
      const raw = await fetchCscCountries();
      return this.mapCountries(raw);
    });
  }

  /**
   * Entrada: countryIso: codigo ISO2.
   * Proceso: Devuelve estados del pais normalizados con cache.
   * Salida: Retorna listado de LocationStateDto.
   */
  async findStatesByCountry(countryIso: string): Promise<LocationStateDto[]> {
    const key = `states:${countryIso}`;
    return this.getOrLoad(key, async () => {
      const raw = await fetchCscStates(countryIso);
      return this.mapStates(raw, countryIso);
    });
  }

  /**
   * Entrada: countryIso: ISO2 pais; stateIso: ISO estado.
   * Proceso: Devuelve ciudades del estado normalizadas con cache.
   * Salida: Retorna listado de LocationCityDto.
   */
  async findCitiesByState(
    countryIso: string,
    stateIso: string,
  ): Promise<LocationCityDto[]> {
    const key = `cities:${countryIso}:${stateIso}`;
    return this.getOrLoad(key, async () => {
      const raw = await fetchCscCities(countryIso, stateIso);
      return this.mapCities(raw, countryIso, stateIso);
    });
  }

  /**
   * Entrada: key: clave de cache; loader: funcion que obtiene datos frescos.
   * Proceso: Retorna valor cacheado vigente o ejecuta loader y almacena resultado.
   * Salida: Retorna el valor tipado T.
   */
  private async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = await loader();
    this.cache.set(key, {
      value,
      expiresAt: now + cscConfig.cacheTtlMs,
    });
    return value;
  }

  /**
   * Entrada: raw: paises crudos del proveedor.
   * Proceso: Normaliza y ordena alfabetico por nombre.
   * Salida: Retorna DTOs de pais.
   */
  private mapCountries(raw: CscCountryRaw[]): LocationCountryDto[] {
    return raw
      .map((item) => ({
        iso2: item.iso2.toUpperCase(),
        name: item.name,
        phonecode: item.phonecode ?? null,
        emoji: item.emoji ?? null,
        flag: item.emoji ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /**
   * Entrada: raw: estados crudos; countryIso: ISO2 del pais.
   * Proceso: Normaliza y ordena alfabetico por nombre.
   * Salida: Retorna DTOs de estado.
   */
  private mapStates(raw: CscStateRaw[], countryIso: string): LocationStateDto[] {
    return raw
      .map((item) => ({
        iso2: item.iso2.toUpperCase(),
        name: item.name,
        countryIso2: (item.country_code ?? countryIso).toUpperCase(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /**
   * Entrada: raw: ciudades crudas; countryIso/stateIso: contexto geografico.
   * Proceso: Normaliza y ordena alfabetico por nombre.
   * Salida: Retorna DTOs de ciudad.
   */
  private mapCities(
    raw: CscCityRaw[],
    countryIso: string,
    stateIso: string,
  ): LocationCityDto[] {
    return raw
      .map((item) => ({
        name: item.name,
        stateIso2: stateIso.toUpperCase(),
        countryIso2: countryIso.toUpperCase(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}

export const locationsRepository = new LocationsRepository();
