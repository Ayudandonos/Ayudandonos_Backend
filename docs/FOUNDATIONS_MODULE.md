# Modulo Fundaciones — Backend

Estado: **IMPLEMENTADO** (perfil extendido, verificacion admin, coordenadas y descubrimiento cercano).

## Endpoints

Base: `/api/v1/foundations`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/` | Opcional | Listado paginado. Publico: solo `VERIFIED`. Admin: todas + `data.stats`. |
| GET | `/nearby` | Publico | Fundaciones `VERIFIED` en radio 1–10 km + tipos (categorias). |
| GET | `/me` | JWT (FOUNDATION) | Perfil completo de la fundacion del usuario autenticado. |
| GET | `/me/branches` | JWT (FOUNDATION) | Listado de sedes de acopio de la fundacion autenticada. |
| POST | `/me/branches` | JWT (FOUNDATION) | Crear sede de acopio. |
| PATCH | `/me/branches/:branchId` | JWT (FOUNDATION) | Actualizar sede (ubicacion, horarios, estado). |
| DELETE | `/me/branches/:branchId` | JWT (FOUNDATION) | Desactivar sede (`INACTIVE`; bloqueada si tiene campanas `PUBLISHED`). |
| POST | `/me/branches/:branchId/activate` | JWT (FOUNDATION) | Reactivar sede inactiva. |
| GET | `/:id/branches` | Opcional | Sedes activas publicas de fundacion verificada. |
| GET | `/:id` | Opcional | Detalle con `branches` y `hasActiveBranch`. |
| GET | `/:id/documents/:type/download` | JWT (owner o ADMIN) | Descarga documento por tipo (almacenamiento privado). |
| PATCH | `/:id` | JWT (owner o ADMIN) | Actualizar perfil (texto, redes, `latitude`/`longitude`). |
| PATCH | `/:id/status` | JWT (**ADMIN**) | Verificacion / rechazo / suspension. |
| POST | `/:id/logo` | JWT (owner o ADMIN) | Subir logo (multipart, campo `logo`). |
| POST | `/:id/documents` | JWT (owner o ADMIN) | Subir documento legal (multipart: `file`, `type`). |

Registro inicial: `POST /api/v1/auth/register/foundation` (modulo auth). Crea fundacion en estado `PENDING` con datos minimos; el perfil se completa via PATCH.

## Verificacion por administradores

Solo un usuario con rol **ADMIN** puede cambiar el estado de una fundacion.

```
Registro (PENDING)
  -> Fundacion completa perfil + documentos obligatorios
  -> Admin revisa en panel
  -> PATCH /foundations/:id/status { "status": "VERIFIED" }
  -> Visible en listado publico, nearby y operaciones
```

| Estado | Significado | Visible al publico |
| ------ | ----------- | ------------------ |
| `PENDING` | En revision | No |
| `VERIFIED` | Aprobada por admin | Si |
| `REJECTED` | Rechazada (exige `rejectionReason`) | No |
| `SUSPENDED` | Suspendida por admin | No |

Para pasar a `VERIFIED` el backend exige perfil completo + documentos obligatorios + al menos una sede activa con datos completos.

Al registrar fundacion (`POST /auth/register/foundation`) se crea automaticamente la sede principal "Sede principal" en estado `INACTIVE` con placeholders. Al actualizar el perfil (`PATCH /foundations/:id`) se sincronizan ciudad, departamento, direccion y telefono en la sede principal; el horario de atencion debe completarse en el gestor de sedes para activarla.

`GET /foundations/nearby` usa coordenadas de **sedes activas** (`foundation_branches`), no solo las de la entidad fundacion.

Al editar una sede vinculada a campanas, el snapshot `deliveryAddress` / coordenadas de esas campanas se sincroniza automaticamente.

Endpoint: `PATCH /api/v1/foundations/:id/status` (solo `authorize('ADMIN')`).

## Descubrimiento cercano

`GET /foundations/nearby?latitude=&longitude=&radiusKm=`

| Param | Default | Notas |
| ----- | ------- | ----- |
| `latitude` | requerido | Origen (GPS del cliente) |
| `longitude` | requerido | Origen |
| `radiusKm` | 5 | Entre 1 y 10 |

Solo incluye fundaciones **`VERIFIED`** con sedes activas que tengan `latitude`/`longitude`.  
Respuesta: `categories` (tipos en la zona) + `items` con `distanceKm` (una entrada por fundacion, sede mas cercana).

## Query params (GET `/`)

| Param | Tipo | Notas |
| ----- | ---- | ----- |
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |
| `search` | string | Nombre, sigla, NIT, categoria, representante o email |
| `status` | enum | Solo admin: `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| `category` | string | Filtro opcional |
| `city` | string | Filtro opcional |
| `department` | string | Filtro opcional |

## Modelo de datos (Prisma)

### Enum `FoundationStatus`

- `PENDING` — registro o revision pendiente
- `VERIFIED` — visible en listado publico (aprobada por admin)
- `REJECTED` — solicitud rechazada (requiere `rejectionReason`)
- `SUSPENDED` — verificada pero suspendida temporalmente

### Tabla `foundations`

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| id | UUID | PK |
| userId | UUID | FK users, 1:1 |
| name | string | Obligatorio |
| acronym | string? | Sigla opcional |
| nit | string? | Unico |
| category | string? | Tipo / rubro (usado en nearby) |
| mission, vision, description | text? | |
| city, department, address | string? | Ubicacion textual |
| latitude, longitude | float? | Coordenadas para mapa y nearby |
| institutionalEmail, phone, website | string? | Contacto |
| legalRepresentativeName, legalRepresentativeDocument | string? | |
| logoUrl | string? | Ruta publica bajo `/uploads` |
| status | FoundationStatus | Default PENDING; solo ADMIN lo cambia |
| verifiedAt, rejectedAt, suspendedAt | datetime? | Timestamps historicos preservados |
| verifiedById | UUID? FK users | Admin que verifico |
| slug | string? unique | URLs publicas futuras |
| deletedAt | datetime? | Soft delete |
| rejectionReason, adminNotes | text? | Gestion admin |
| createdAt, updatedAt | datetime | |

### Tabla `foundation_social_links`

Redes sociales (1:N). Unicidad `(foundationId, network)`.

Tipos: `FACEBOOK`, `INSTAGRAM`, `X`, `LINKEDIN`, `YOUTUBE`, `TIKTOK`, `OTHER`.

### Tabla `foundation_documents`

Documentos legales (1:N). Unicidad `(foundationId, type)`.

Tipos:

- `RUT` — obligatorio para verificacion
- `LEGAL_EXISTENCE_CERTIFICATE` — obligatorio
- `LEGAL_REPRESENTATIVE_ID` — obligatorio
- `BANK_CERTIFICATION` — opcional

### Tabla `foundation_admin_observations`

Historial de observaciones administrativas (1:N). Se crea registro al cambiar estado con `adminNotes`.

### Enum `FoundationBranchStatus`

- `ACTIVE` — sede disponible para acopio
- `INACTIVE` — sede desactivada (no se elimina fisicamente)

### Tabla `foundation_branches`

Sedes de acopio donde los donantes entregan aportes en especie (1:N con `foundations`).

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| id | UUID | PK |
| foundationId | UUID | FK foundations |
| name | string | Nombre de la sede |
| department, city, address | string | Ubicacion textual |
| reference | string? | Punto de referencia opcional |
| phone | string | Contacto de la sede |
| openingHours | string | Horarios de atencion |
| latitude, longitude | float? | Coordenadas para mapa |
| status | FoundationBranchStatus | Default ACTIVE |
| createdAt, updatedAt | datetime | |

Reglas: solo rol FOUNDATION gestiona sus sedes; debe permanecer al menos una sede `ACTIVE`; geocodificacion opcional al crear/actualizar direccion.

### Campanas y sedes (Fase B)

Cada campana referencia una sede activa mediante `foundation_branch_id` (FK obligatoria). Al crear o cambiar la sede, el backend copia direccion y coordenadas de la sede a `delivery_*` para compatibilidad con listados y mapas existentes.

| Campo API create/update | Descripcion |
| ----------------------- | ----------- |
| `foundationBranchId` | UUID de sede `ACTIVE` de la fundacion (requerido al crear) |

La respuesta de campana incluye objeto `branch` con nombre, direccion, horarios, telefono y coordenadas de la sede asociada.

Frontend: `/foundation/campaigns/new` y edicion usan selector de sedes (`GET /foundations/me/branches`) en lugar de mapa editable.

## Reglas de negocio

1. El listado publico y `/nearby` solo exponen fundaciones `VERIFIED`.
2. La verificacion (`VERIFIED`) la realiza **unicamente un ADMIN** y exige perfil completo + documentos obligatorios + al menos una sede activa completa. Si el perfil no tiene `country`/`city`/`department`/`address` pero una sede activa si, el backend los copia al perfil antes de validar. Si aun falta algo, el 400 incluye `errors` con los campos faltantes.
3. El NIT debe ser unico en la plataforma.
4. Rechazo requiere `rejectionReason`.
5. Documentos legales y logos se almacenan en **Vercel Blob** en produccion (`BLOB_READ_WRITE_TOKEN`). En local sin token, se usa disco (`uploads/`).
6. DTO de detalle filtrado por rol: publico no recibe documentos, email del representante ni datos legales sensibles.
7. Descarga de documentos restringida a owner y ADMIN.
8. **Acceso operativo (frontend):** una fundacion solo puede usar campanas, necesidades, solicitudes y entregas cuando `isProfileComplete`, `hasRequiredDocuments` y `status === VERIFIED`. Mientras tanto, el dashboard la mantiene en `/foundation/profile`.
9. **Sesion auth:** `PublicFoundationDto` incluye `isProfileComplete`, `hasRequiredDocuments`, `latitude` y `longitude` (calculados en login, registro y `/auth/me`).
10. Coordenadas opcionales; sin ellas la fundacion no aparece en `/nearby`.
11. Al actualizar perfil con direccion + ciudad/departamento, el backend puede geocodificar
    y persistir `latitude`/`longitude` automaticamente (ver `docs/LOCATIONS_MODULE.md`).

## Seguridad de archivos

- Logos: URL publica de Vercel Blob (store `BLOB_ACCESS=public`) o `/uploads/foundations/{id}/logo/` en local.
- Documentos: referencia Blob u ruta privada local; nunca se expone `fileUrl` en el DTO publico.
- Acceso a documentos solo via endpoint autenticado de descarga.

## Informe de validacion

Ver `docs/FOUNDATIONS_VALIDATION_REPORT.md` para checklist completo, pruebas y deuda tecnica.

## Capas

```
src/modules/foundations/
  foundations.routes.ts
  foundations.controller.ts
  foundations.service.ts
  foundations.repository.ts
  foundations.validations.ts
  foundations.dto.ts
  foundation-branches.controller.ts
  foundation-branches.service.ts
  foundation-branches.repository.ts
  foundation-branches.validations.ts
  foundation-branches.dto.ts
```

Los endpoints de sedes se registran en `foundations.routes.ts` bajo `/me/branches`.

Util geo: `src/shared/utils/geo.util.ts` (Haversine + bounding box).

## Variables de entorno

| Variable | Descripcion |
| -------- | ----------- |
| `UPLOAD_DIR` | Directorio local de archivos (default `./uploads`) |
| `UPLOAD_MAX_FILE_SIZE_MB` | Tamano maximo por archivo |
| `PUBLIC_BASE_URL` | URL base para construir `logoUrl` en almacenamiento local |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob (obligatorio en Vercel) |
| `BLOB_ACCESS` | `public` o `private` (debe coincidir con el store; usar `public` para logos) |

## Frontend relacionado

Rutas UI:

- `/foundations` — listado publico
- `/foundations/:id` — detalle
- `/foundation/profile` — edicion perfil (FOUNDATION), incluir coords y sedes de acopio
- `/admin/foundations` — verificacion (ADMIN)
- Mapa / zona cercana — consumir `GET /foundations/nearby`
