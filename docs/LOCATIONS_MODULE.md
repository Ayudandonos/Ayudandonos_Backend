# Modulo Locations

Proxy de ubicaciones internacionales (pais -> estado/departamento -> ciudad)
y geocodificacion estructurada (Nominatim / OSM).

El frontend **nunca** consume CountryStateCity ni Nominatim directamente.

## Variables de entorno

```env
CSC_API_KEY=tu_api_key
CSC_API_BASE_URL=https://api.countrystatecity.in/v1
CSC_CACHE_TTL_MS=86400000

GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_USER_AGENT=AyudandonosBackend/1.0 (contacto: apoyo_ud@fesc.edu.co)
GEOCODING_CACHE_TTL_MS=86400000
GEOCODING_MIN_INTERVAL_MS=1100
GEOCODING_TIMEOUT_MS=5000
```

Sin `CSC_API_KEY` los endpoints de catalogo responden `503`.
La geocodificacion usa Nominatim (sin API key) con User-Agent obligatorio.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/api/v1/locations/countries` | No | Paises ordenados A-Z |
| GET | `/api/v1/locations/countries/:countryIso/states` | No | Estados del pais |
| GET | `/api/v1/locations/countries/:countryIso/states/:stateIso/cities` | No | Ciudades del estado |
| GET | `/api/v1/locations/geocode` | JWT | Geocodificacion estructurada |

### Geocode — query

| Param | Notas |
| ----- | ----- |
| `street` | Direccion / calle |
| `city` | Ciudad |
| `state` | Departamento/estado |
| `country` | Pais |
| `q` | Texto libre (solo fallback) |

Reglas:

- Debe venir al menos `city`, `state`, `(street + country)` o `q`.
- `street` sin `city`/`state` => `400`.
- Preferencia: busqueda estructurada + filtro por ciudad/departamento.
- Si country es Colombia (o vacio con city/state) se aplica `countrycodes=co`.
- Sin match confiable => `404` con `errors.geocode = ['NO_MATCH']`.

### Respuesta geocode

```json
{
  "success": true,
  "message": "Ubicación geocodificada correctamente",
  "data": {
    "latitude": 7.8939,
    "longitude": -72.5078,
    "displayName": "Calle 13 #14-20, Cúcuta, Norte de Santander, Colombia",
    "provider": "nominatim"
  },
  "errors": null
}
```

## Persistencia automatica

Al guardar fundacion (`PATCH /foundations/:id`), campana o delivery de donacion,
si hay direccion + ciudad/departamento y faltan coords (o cambio la ubicacion),
el backend geocodifica y persiste `latitude`/`longitude`.

Si el geocode falla, el guardado del perfil/campana/entrega **no se tumba**;
las coords quedan `null` solo cuando la ubicacion cambio.

## Arquitectura

```
Routes -> Controller -> Service -> Repository/Client
```

- Catalogo: cache CSC en memoria.
- Geocode: Nominatim + throttle (~1 req/s) + cache TTL 24h + filtro de localidad.

## Frontend

- Selectores de pais/departamento/ciudad via `/locations/countries|states|cities`.
- Preview del pin: `GET /locations/geocode`.
- No mostrar inputs de lat/lng; consumir coords del backend para mapa/nearby.
