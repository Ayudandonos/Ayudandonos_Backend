# Modulo Admin — Backend

Estado: **IMPLEMENTADO** (dashboard v1).

## Endpoint

Base: `/api/v1/admin`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/dashboard` | JWT `ADMIN` | KPIs, ultimas necesidades y campanas destacadas |

## Reglas de negocio (v1)

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

## Verificacion con frontend

1. `npm run db:setup` (migraciones + seed ADMIN).
2. `npm run dev` en backend (`:3000`).
3. Frontend: `VITE_API_URL=http://localhost:3000/api/v1`.
4. Login con email del seed y `SEED_ADMIN_PASSWORD`.
5. Ruta UI `/admin/dashboard` debe cargar sin error de red.

## Administradores de desarrollo

Ver tabla en [README.md](../README.md) (`SEED_ADMIN_PASSWORD` en `.env`).
