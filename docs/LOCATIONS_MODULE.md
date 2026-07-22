# Modulo Locations

Proxy de ubicaciones internacionales (pais -> estado/departamento -> ciudad).

El frontend **nunca** consume CountryStateCity directamente. Toda la clave API permanece en el backend.

## Variables de entorno

```env
CSC_API_KEY=tu_api_key
CSC_API_BASE_URL=https://api.countrystatecity.in/v1
CSC_CACHE_TTL_MS=86400000
```

Sin `CSC_API_KEY` los endpoints responden `503` con mensaje amigable.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/api/v1/locations/countries` | No | Paises ordenados A-Z |
| GET | `/api/v1/locations/countries/:countryIso/states` | No | Estados del pais |
| GET | `/api/v1/locations/countries/:countryIso/states/:stateIso/cities` | No | Ciudades del estado |

## Arquitectura

```
Routes -> Controller -> Service -> Repository (cache) -> Client CSC
```

- Cache en memoria por clave (`countries`, `states:CO`, `cities:CO:NSA`) con TTL configurable.
- Respuestas normalizadas (`iso2`, `name`, `emoji`/`flag` en paises).
- Proveedor intercambiable cambiando el client sin afectar el contrato del frontend.

## Frontend

Feature `src/features/location/` con:

- Hooks: `useCountries`, `useStates`, `useCities` (TanStack Query)
- Componentes: `LocationSelector`, `CountrySelect`, `StateSelect`, `CitySelect`
- Uso: `<LocationSelector value={location} onChange={setLocation} />`

Integrado inicialmente en el perfil de fundaciones.
