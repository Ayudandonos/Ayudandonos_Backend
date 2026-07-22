import { cscConfig } from '../../config/env.config.js';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { CscCityRaw, CscCountryRaw, CscStateRaw } from './locations.dto.js';

/**
 * Entrada: path: ruta relativa del recurso CSC (ej. /countries).
 * Proceso: Llama a CountryStateCity con API key de servidor y parsea JSON.
 * Salida: Retorna el cuerpo tipado o lanza AppError.
 */
async function fetchCsc<T>(path: string): Promise<T> {
  if (!cscConfig.apiKey) {
    throw new AppError(API_MESSAGES.LOCATIONS_PROVIDER_NOT_CONFIGURED, 503);
  }

  const url = `${cscConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CSCAPI-KEY': cscConfig.apiKey,
        Accept: 'application/json',
      },
    });
  } catch {
    throw new AppError(API_MESSAGES.LOCATIONS_PROVIDER_UNAVAILABLE, 503);
  }

  if (response.status === 404) {
    throw new AppError(API_MESSAGES.LOCATIONS_COUNTRY_NOT_FOUND, 404);
  }

  if (!response.ok) {
    throw new AppError(API_MESSAGES.LOCATIONS_PROVIDER_UNAVAILABLE, 503);
  }

  return (await response.json()) as T;
}

/**
 * Entrada: Ninguna.
 * Proceso: Obtiene el listado crudo de paises desde CSC.
 * Salida: Retorna arreglo de paises del proveedor.
 */
export async function fetchCscCountries(): Promise<CscCountryRaw[]> {
  return fetchCsc<CscCountryRaw[]>('/countries');
}

/**
 * Entrada: countryIso: codigo ISO2 del pais.
 * Proceso: Obtiene estados/departamentos del pais desde CSC.
 * Salida: Retorna arreglo de estados del proveedor.
 */
export async function fetchCscStates(countryIso: string): Promise<CscStateRaw[]> {
  return fetchCsc<CscStateRaw[]>(`/countries/${countryIso}/states`);
}

/**
 * Entrada: countryIso: ISO2 pais; stateIso: ISO del estado.
 * Proceso: Obtiene ciudades del estado desde CSC.
 * Salida: Retorna arreglo de ciudades del proveedor.
 */
export async function fetchCscCities(
  countryIso: string,
  stateIso: string,
): Promise<CscCityRaw[]> {
  return fetchCsc<CscCityRaw[]>(
    `/countries/${countryIso}/states/${stateIso}/cities`,
  );
}
