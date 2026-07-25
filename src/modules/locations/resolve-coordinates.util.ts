import { locationsService } from './locations.service.js';

export type LocationPersistInput = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type ResolvedCoordinates = {
  latitude: number | null;
  longitude: number | null;
  geocoded: boolean;
};

/**
 * Entrada: current: coords actuales; incoming: coords del payload; location: direccion/localidad; locationChanged: si cambio la ubicacion.
 * Proceso: Usa coords explicitas, geocodifica si faltan, o limpia/conserva segun cambio de direccion.
 * Salida: Retorna latitude/longitude a persistir y si se geocodifico.
 */
export async function resolveCoordinatesForPersist(options: {
  currentLatitude: number | null;
  currentLongitude: number | null;
  incomingLatitude?: number | null;
  incomingLongitude?: number | null;
  location: LocationPersistInput;
  locationChanged: boolean;
}): Promise<ResolvedCoordinates> {
  const {
    currentLatitude,
    currentLongitude,
    incomingLatitude,
    incomingLongitude,
    location,
    locationChanged,
  } = options;

  const hasIncomingLat = incomingLatitude !== undefined;
  const hasIncomingLng = incomingLongitude !== undefined;

  if (hasIncomingLat || hasIncomingLng) {
    if (
      incomingLatitude !== undefined &&
      incomingLongitude !== undefined &&
      incomingLatitude !== null &&
      incomingLongitude !== null
    ) {
      return {
        latitude: incomingLatitude,
        longitude: incomingLongitude,
        geocoded: false,
      };
    }

    if (incomingLatitude === null && incomingLongitude === null) {
      // Continua para intentar geocode o limpiar.
    } else if (hasIncomingLat !== hasIncomingLng) {
      return {
        latitude: currentLatitude,
        longitude: currentLongitude,
        geocoded: false,
      };
    }
  }

  const missingCurrentCoords = currentLatitude === null || currentLongitude === null;
  const explicitClear =
    incomingLatitude === null && incomingLongitude === null;

  const shouldGeocode =
    locationChanged || missingCurrentCoords || explicitClear;

  if (!shouldGeocode) {
    return {
      latitude: currentLatitude,
      longitude: currentLongitude,
      geocoded: false,
    };
  }

  const street = location.street?.trim() || undefined;
  const city = location.city?.trim() || undefined;
  const state = location.state?.trim() || undefined;
  const country = location.country?.trim() || 'Colombia';

  if (!city && !state) {
    if (locationChanged || explicitClear) {
      return { latitude: null, longitude: null, geocoded: false };
    }

    return {
      latitude: currentLatitude,
      longitude: currentLongitude,
      geocoded: false,
    };
  }

  const geocoded = await locationsService.tryGeocode({
    street,
    city,
    state,
    country,
  });

  if (geocoded) {
    return {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      geocoded: true,
    };
  }

  if (locationChanged || explicitClear) {
    return { latitude: null, longitude: null, geocoded: false };
  }

  return {
    latitude: currentLatitude,
    longitude: currentLongitude,
    geocoded: false,
  };
}
