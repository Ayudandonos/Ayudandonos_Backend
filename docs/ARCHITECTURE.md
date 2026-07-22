# Arquitectura Backend — Ayudándonos

## Vision

API REST desacoplada con arquitectura por capas y modulos de dominio. Preparada para escalar sin reorganizar estructura.

## Flujo de peticion

```
HTTP Request
  -> Rate Limit / Helmet / CORS / Morgan
  -> Router (/api/v1)
    -> Module Routes
      -> validate (Zod)
      -> authenticate / authorize (si aplica)
      -> Controller
        -> Service
          -> Repository
            -> Prisma -> PostgreSQL
      <- ApiResponseBuilder
  <- errorHandler (si falla)
```

## Carpetas principales

| Carpeta | Responsabilidad |
| ------- | --------------- |
| `src/config/` | Variables de entorno y configuracion |
| `src/database/` | Cliente Prisma singleton |
| `src/middlewares/` | Errores, auth, validacion |
| `src/modules/` | Dominios de negocio |
| `src/shared/` | Errores, respuestas, constantes |
| `src/routes/` | Agregador de rutas |
| `src/utils/` | JWT, hash, asyncHandler |
| `src/docs/` | Configuracion Swagger |
| `prisma/` | Esquema, migraciones y seed (`seed.ts`, `seed-data.ts`) |

## Modulos

| Modulo | Dominio |
| ------ | ------- |
| `auth` | Login, registro, JWT |
| `users` | Perfiles y roles |
| `foundations` | Fundaciones verificadas |
| `campaigns` | Campanas de recoleccion |
| `needs` | Necesidades por campana |
| `donations` | Ciclo de vida de donaciones |
| `notifications` | Alertas in-app |
| `admin` | Dashboard, reportes y listados administrativos |
| `locations` | Proxy de paises/departamentos/ciudades |
| `statistics` | Reportes y metricas (legado / extension) |

## Seed

El dataset demo vive en `prisma/`. Cada seed hace `TRUNCATE` y recarga solo esos datos. Ver `docs/SEED.md`.

## Respuesta estandar

```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": {},
  "errors": {}
}
```

## Seguridad

JWT, bcrypt, Helmet, CORS, Rate Limit, validacion Zod en toda entrada.
