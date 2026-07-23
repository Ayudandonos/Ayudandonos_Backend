/**
 * Entrada: value: texto a normalizar.
 * Proceso: Quita acentos, pasa a minusculas y colapsa espacios.
 * Salida: Retorna cadena normalizada para comparaciones geograficas.
 */
export function normalizeLocationText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Entrada: haystack: texto donde buscar; needle: fragmento esperado.
 * Proceso: Compara inclusiones normalizadas evitando matches vacios.
 * Salida: Retorna true si needle esta contenido en haystack.
 */
export function locationTextIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const normalizedHaystack = normalizeLocationText(haystack);
  const normalizedNeedle = normalizeLocationText(needle);

  if (!normalizedHaystack || !normalizedNeedle) {
    return false;
  }

  return normalizedHaystack.includes(normalizedNeedle);
}

export type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
};

export type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

/**
 * Entrada: result: resultado Nominatim; city/state: filtros opcionales del request.
 * Proceso: Valida que el resultado coincida con ciudad y/o departamento solicitados.
 * Salida: Retorna true si el match es confiable.
 */
export function matchesRequestedLocality(
  result: NominatimSearchResult,
  city?: string,
  state?: string,
): boolean {
  const address = result.address ?? {};
  const localityCandidates = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
    result.display_name,
  ];
  const stateCandidates = [address.state, address.region, result.display_name];

  if (city) {
    const cityMatched = localityCandidates.some((candidate) =>
      locationTextIncludes(candidate, city),
    );
    if (!cityMatched) {
      return false;
    }
  }

  if (state) {
    const stateMatched = stateCandidates.some((candidate) =>
      locationTextIncludes(candidate, state),
    );
    if (!stateMatched) {
      return false;
    }
  }

  return true;
}

/**
 * Entrada: street/city/state/country: partes de ubicacion.
 * Proceso: Construye query libre ordenada para fallback de geocoding.
 * Salida: Retorna texto concatenado o cadena vacia.
 */
export function buildFreeFormQuery(parts: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}): string {
  return [parts.street, parts.city, parts.state, parts.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(', ');
}

/**
 * Entrada: street/city/state/country: partes usadas como clave de cache.
 * Proceso: Normaliza y une segmentos con separador estable.
 * Salida: Retorna clave de cache.
 */
export function buildGeocodeCacheKey(parts: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  q?: string;
}): string {
  return [
    normalizeLocationText(parts.street),
    normalizeLocationText(parts.city),
    normalizeLocationText(parts.state),
    normalizeLocationText(parts.country),
    normalizeLocationText(parts.q),
  ].join('|');
}

/**
 * Entrada: country: nombre de pais opcional; city/state: contexto local.
 * Proceso: Decide si restringir busqueda a Colombia (countrycodes=co).
 * Salida: Retorna true cuando debe aplicarse countrycodes=co.
 */
export function shouldRestrictToColombia(
  country?: string,
  city?: string,
  state?: string,
): boolean {
  const normalizedCountry = normalizeLocationText(country);

  if (!normalizedCountry) {
    return Boolean(city || state);
  }

  return (
    normalizedCountry === 'colombia' ||
    normalizedCountry === 'co' ||
    normalizedCountry.includes('colombia')
  );
}
