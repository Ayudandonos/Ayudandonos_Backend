# Modulo Fundaciones — Backend

Estado: **IMPLEMENTADO** (perfil extendido alineado al prototipo).

## Endpoints

Base: `/api/v1/foundations`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/` | Opcional | Listado paginado. Publico: solo `VERIFIED`. Admin: todas + `data.stats`. |
| GET | `/me` | JWT (FOUNDATION) | Perfil completo de la fundacion del usuario autenticado. |
| GET | `/:id` | Opcional | Detalle. Publico si `VERIFIED`; admin u owner si otro estado. |
| GET | `/:id/documents/:type/download` | JWT (owner o ADMIN) | Descarga documento por tipo (almacenamiento privado). |
| PATCH | `/:id` | JWT (owner o ADMIN) | Actualizar perfil (campos de texto y redes sociales). |
| PATCH | `/:id/status` | JWT (ADMIN) | Cambiar estado: `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`. |
| POST | `/:id/logo` | JWT (owner o ADMIN) | Subir logo (multipart, campo `logo`). |
| POST | `/:id/documents` | JWT (owner o ADMIN) | Subir documento legal (multipart: `file`, `type`). |

Registro inicial: `POST /api/v1/auth/register/foundation` (modulo auth). Crea fundacion en estado `PENDING` con datos minimos; el perfil se completa via PATCH.

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
- `VERIFIED` — visible en listado publico
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
| category | string? | |
| mission, vision, description | text? | |
| city, department, address | string? | Ubicacion |
| institutionalEmail, phone, website | string? | Contacto |
| legalRepresentativeName, legalRepresentativeDocument | string? | |
| logoUrl | string? | Ruta publica bajo `/uploads` |
| status | FoundationStatus | Default PENDING |
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

## Reglas de negocio

1. El listado publico solo expone fundaciones `VERIFIED`.
2. La verificacion (`VERIFIED`) exige perfil completo: campos obligatorios + documentos RUT, certificado legal e ID del representante.
3. El NIT debe ser unico en la plataforma.
4. Rechazo requiere `rejectionReason`.
5. Documentos legales en almacenamiento **privado** (`uploads/private/`). Solo logos se sirven via `/uploads/foundations`.
6. DTO de detalle filtrado por rol: publico no recibe documentos, email del representante ni datos legales sensibles.
7. Descarga de documentos restringida a owner y ADMIN.
8. **Acceso operativo (frontend):** una fundacion solo puede usar campanas, necesidades, solicitudes y entregas cuando `isProfileComplete`, `hasRequiredDocuments` y `status === VERIFIED`. Mientras tanto, el dashboard la mantiene en `/foundation/profile`.
9. **Sesion auth:** `PublicFoundationDto` incluye `isProfileComplete` y `hasRequiredDocuments` (calculados en login, registro y `/auth/me`) para que el frontend aplique el guard sin consultas extra.

## Seguridad de archivos

- Logos: publicos en `/uploads/foundations/{id}/logo/`.
- Documentos: privados en `/uploads/private/foundations/{id}/documents/`.
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
```

## Variables de entorno

| Variable | Descripcion |
| -------- | ----------- |
| `UPLOAD_DIR` | Directorio local de archivos (default `./uploads`) |
| `UPLOAD_MAX_FILE_SIZE_MB` | Tamano maximo por archivo |
| `PUBLIC_BASE_URL` | URL base para construir `fileUrl` y `logoUrl` |

## Frontend relacionado

Rutas UI:

- `/foundations` — listado publico
- `/foundations/:id` — detalle
- `/foundation/profile` — edicion perfil (FOUNDATION)
- `/admin/foundations` — verificacion (ADMIN)
