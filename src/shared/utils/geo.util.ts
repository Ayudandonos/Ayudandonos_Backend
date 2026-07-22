const EARTH_RADIUS_KM = 6371;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type GeoBoundingBox = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
};

/**
 * Entrada: from: punto origen; to: punto destino.
 * Proceso: Calcula distancia Haversine entre dos coordenadas en kilometros.
 * Salida: Retorna la distancia en km.
 */
export function haversineDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Entrada: origin: punto central; radiusKm: radio en kilometros.
 * Proceso: Calcula un bounding box aproximado para prefiltrar candidatos.
 * Salida: Retorna limites de latitud y longitud.
 */
export function boundingBoxForRadius(origin: GeoPoint, radiusKm: number): GeoBoundingBox {
  const latDelta = radiusKm / 111;
  const lngDenominator = Math.max(Math.cos((origin.latitude * Math.PI) / 180) * 111, 0.01);
  const lngDelta = radiusKm / lngDenominator;

  return {
    minLatitude: origin.latitude - latDelta,
    maxLatitude: origin.latitude + latDelta,
    minLongitude: origin.longitude - lngDelta,
    maxLongitude: origin.longitude + lngDelta,
  };
}
