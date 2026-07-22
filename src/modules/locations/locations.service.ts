import { locationsRepository } from './locations.repository.js';
import type {
  LocationCityDto,
  LocationCountryDto,
  LocationStateDto,
} from './locations.dto.js';

/**
 * Entrada: Ninguna.
 * Proceso: Orquesta la obtencion de paises via repositorio (cache + CSC).
 * Salida: Retorna listado de paises normalizados.
 */
export async function listCountries(): Promise<LocationCountryDto[]> {
  return locationsRepository.findCountries();
}

/**
 * Entrada: countryIso: codigo ISO2 del pais.
 * Proceso: Orquesta la obtencion de estados del pais.
 * Salida: Retorna listado de estados normalizados.
 */
export async function listStatesByCountry(
  countryIso: string,
): Promise<LocationStateDto[]> {
  return locationsRepository.findStatesByCountry(countryIso);
}

/**
 * Entrada: countryIso: ISO2 pais; stateIso: ISO del estado.
 * Proceso: Orquesta la obtencion de ciudades del estado.
 * Salida: Retorna listado de ciudades normalizadas.
 */
export async function listCitiesByState(
  countryIso: string,
  stateIso: string,
): Promise<LocationCityDto[]> {
  return locationsRepository.findCitiesByState(countryIso, stateIso);
}

export const locationsService = {
  listCountries,
  listStatesByCountry,
  listCitiesByState,
};
