# Modulo Admin — Backend

Estado: **IMPLEMENTADO**.

Incluye tambien la **verificacion de fundaciones** via el modulo Foundations
(`PATCH /foundations/:id/status`, solo rol `ADMIN`). Ver `docs/FOUNDATIONS_MODULE.md`.

## Endpoints

Base: `/api/v1/admin`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/dashboard` | JWT `ADMIN` | KPIs, ultimas necesidades y campanas destacadas |
| GET | `/reports` | JWT `ADMIN` | Resumen y series para reportes (roles, estados, actividad mensual) |
| GET | `/campaigns` | JWT `ADMIN` | Listado administrativo de campanas (fundacion, creador, conteo donaciones) |

## Reglas de negocio (dashboard)

### KPIs

| Campo | Regla |
| ----- | ----- |
| `activeCampaigns` | `PUBLISHED`, no eliminadas, vigentes (`endDate` null o `>= now`, `startDate` null o `<= now`) |
| `pendingNeeds` | `fulfilledQuantity < quantity`, campana no cancelada ni eliminada |
| `deliveredAids` | Donaciones con `status IN (DELIVERED, CONFIRMED)` |
| `verifiedFoundations` | `foundation.status = VERIFIED` y usuario activo |
| `activeCampaignsTrendPercent` | `ROUND((activas_hoy - activas_hace_30d) / activas_hace_30d * 100)`; `null` si denominador 0 |
| `pendingNeedsCritical` | Existe need pendiente con `priority = HIGH` |

### `latestNeeds`

- Needs pendientes en campanas `PUBLISHED`.
- Orden: `createdAt DESC` (expuesto como `publishedAt` ISO 8601).
- Query: `latestNeedsLimit` (default 10, max 50).

### `featuredCampaigns`

- Campanas `PUBLISHED` vigentes.
- `progressPercent`: `MIN(100, ROUND(SUM(fulfilledQuantity) / SUM(quantity) * 100))` por campana.
- Orden: progreso DESC, `endDate` ASC, `createdAt` DESC.
- `daysRemaining`: `CEIL((endDate - now) / 1 dia)`; `null` sin `endDate`.
- Primer item con `isPrimary: true`.
- Query: `featuredCampaignsLimit` (default 3, max 10).

## Reportes (`GET /reports`)

Agrega conteos globales y series para el panel de reportes del frontend:

- Totales de usuarios, fundaciones, campanas y donaciones
- Distribucion por rol / estado de fundacion / estado de donacion / estado de campana
- Actividad mensual (usuarios y donaciones) en una ventana reciente

## Campanas admin (`GET /campaigns`)

Listado paginado con filtros (query Zod en `admin.validations.ts`): fundacion, creador, fechas y conteo de donaciones asociadas.

## Verificacion con frontend

1. `npm run db:setup` (migraciones + seed completo; vacia BD y carga dataset demo).
2. `npm run dev` en backend (`:3000`).
3. Frontend: `VITE_API_URL=http://localhost:3000/api/v1`.
4. Login con email del seed y `SEED_ADMIN_PASSWORD`.
5. Rutas UI tipicas: `/admin/reports`, `/admin/users`, `/admin/campaigns`, `/admin/profile`.

## Administradores de desarrollo

Ver [SEED.md](./SEED.md) y [README.md](../README.md) (`SEED_ADMIN_PASSWORD` en `.env`).

**Nota:** en cada deploy el seed vuelve a cargar estos admins y el resto del dataset demo.
