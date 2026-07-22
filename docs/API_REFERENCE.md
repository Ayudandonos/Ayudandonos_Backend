# Referencia de API — Ayudándonos Backend

**Base URL:** `/api/v1`  
**Swagger UI:** `/api/v1/docs`  
**Formato de respuesta:** `{ success, message, data, errors }`  
**Auth:** header `Authorization: Bearer <jwt>` cuando aplique

Este documento cubre los endpoints de Fase 4 (campanas, needs, donations) y Fase 5 (notificaciones), mas el panel admin. Auth, users y foundations estan detallados en `specs/modules/`.

---

## Convenciones

| Concepto | Detalle |
| -------- | ------- |
| Paginacion | `page` (default 1), `limit` (default 10 o 20; max 100) |
| Meta | `{ page, limit, total, totalPages }` en listados |
| Fechas | ISO 8601 (`date-time`) |
| UUIDs | Identificadores de recursos |
| Soft delete | Campanas y needs usan `deletedAt`; no aparecen en listados publicos |

---

## Campaigns — `/campaigns`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/campaigns` | Publico | Listado paginado de campanas `PUBLISHED` (fundacion `VERIFIED`) |
| GET | `/campaigns/me` | FOUNDATION operativa | Campanas propias (todos los estados) |
| GET | `/campaigns/:id` | Opcional | Detalle publico si `PUBLISHED`; owner ve propias |
| POST | `/campaigns` | FOUNDATION operativa | Crear (`DRAFT` por defecto) |
| PATCH | `/campaigns/:id` | FOUNDATION operativa | Actualizar propia |
| DELETE | `/campaigns/:id` | FOUNDATION operativa | Soft delete |

### Query (GET `/` y GET `/me`)

| Param | Tipo | Notas |
| ----- | ---- | ----- |
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |
| `search` | string | Titulo y descripcion |
| `status` | enum | Solo `/me`: `DRAFT`, `PUBLISHED`, `FINISHED`, `CANCELLED` |

### Body crear / actualizar (campos principales)

```json
{
  "title": "Campana de abrigo",
  "description": "Recoleccion de cobijas",
  "status": "DRAFT",
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-09-01T00:00:00.000Z",
  "imageUrl": null,
  "deliveryAddress": "Calle 10 #20-30, Bogota",
  "deliveryLatitude": 4.711,
  "deliveryLongitude": -74.0721
}
```

Publicar (`status: PUBLISHED`) exige `startDate` y `endDate` con `endDate >= startDate`.

### Estados

`DRAFT` → `PUBLISHED` | `CANCELLED`  
`PUBLISHED` → `FINISHED` | `CANCELLED`  
`FINISHED` / `CANCELLED` inmutables

---

## Needs — `/needs`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/needs?campaignId=` | Publico | Listar necesidades de una campana |
| GET | `/needs/:id` | Publico | Detalle |
| POST | `/needs` | FOUNDATION dueña operativa | Crear |
| PATCH | `/needs/:id` | FOUNDATION dueña operativa | Actualizar |
| DELETE | `/needs/:id` | FOUNDATION dueña operativa | Soft delete |

### Body crear

```json
{
  "campaignId": "uuid",
  "name": "Cobijas",
  "description": "Tamaño individual",
  "quantity": 100,
  "unit": "unidades",
  "priority": "HIGH"
}
```

`priority`: `LOW` | `MEDIUM` | `HIGH`  
`fulfilledQuantity` se actualiza con donaciones confirmadas/entregadas segun reglas de negocio.

---

## Donations — `/donations`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| POST | `/donations` | USER | Crear compromiso (+ chat; `initialMessage` opcional) |
| GET | `/donations/me` | USER | Listar propias |
| GET | `/donations/:id` | donor o foundation | Detalle con historial |
| PATCH | `/donations/:id/status` | donor / foundation | Cambiar estado |
| PATCH | `/donations/:id/delivery` | FOUNDATION operativa | Agendar punto/fecha de entrega |
| GET | `/donations/:id/messages` | participantes | Listar mensajes del chat |
| POST | `/donations/:id/messages` | participantes | Enviar mensaje |
| GET | `/foundation/requests` | FOUNDATION operativa | Solicitudes recibidas por la fundacion |

### POST `/donations` — body

```json
{
  "needId": "uuid",
  "quantity": 5,
  "notes": "Puedo entregar el sabado",
  "estimatedDeliveryAt": "2026-08-15T15:00:00.000Z",
  "initialMessage": "Hola, quiero coordinar la entrega"
}
```

Al crear:

1. Se valida disponibilidad de la necesidad.
2. Se crea la donacion en `COMMITTED`.
3. Se abre `Conversation` 1:1.
4. Si hay `initialMessage`, se inserta el primer mensaje.
5. Se notifica a la fundacion (`DONATION_CREATED` y, si aplica, `DONATION_MESSAGE`).

### Estados

`COMMITTED` → `IN_TRANSIT` | `CANCELLED`  
`IN_TRANSIT` → `DELIVERED` | `CANCELLED`  
`DELIVERED` → `CONFIRMED` | `CANCELLED`  
`CONFIRMED` / `CANCELLED` terminales (segun reglas del service)

Cada cambio queda en `donation_status_history`.

### PATCH `/donations/:id/delivery` — body

```json
{
  "deliveryAddress": "Calle 10 #20-30",
  "deliveryLatitude": 4.711,
  "deliveryLongitude": -74.0721,
  "estimatedDeliveryAt": "2026-08-15T15:00:00.000Z"
}
```

Notifica al donante (`DONATION_DELIVERY_UPDATED`).

### Mensajes

```json
{ "body": "Confirmado, nos vemos a las 3pm" }
```

Notifica a la otra parte (`DONATION_MESSAGE`).

---

## Notifications — `/notifications`

JWT requerido (cualquier rol autenticado). Solo el dueño ve y marca sus notificaciones.

| Metodo | Ruta | Descripcion |
| ------ | ---- | ----------- |
| GET | `/notifications` | Listado paginado; query `unreadOnly` |
| GET | `/notifications/unread-count` | `{ unreadCount }` |
| PATCH | `/notifications/read-all` | Marca todas leidas; `{ updatedCount }` |
| PATCH | `/notifications/:id/read` | Marca una leida |

### Query listado

| Param | Tipo | Default |
| ----- | ---- | ------- |
| `page` | number | 1 |
| `limit` | number | 20 |
| `unreadOnly` | boolean | false |

### Item de notificacion (`data.items[]`)

```json
{
  "id": "uuid",
  "type": "DONATION_CREATED",
  "title": "Nueva donacion",
  "body": "Texto legible",
  "linkPath": "/foundation/requests/<donationId>",
  "resourceType": "donation",
  "resourceId": "uuid",
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-07-22T12:00:00.000Z"
}
```

### Tipos

| Tipo | Destinatario tipico |
| ---- | ------------------- |
| `DONATION_CREATED` | Usuario de la fundacion |
| `DONATION_STATUS_CHANGED` | La otra parte |
| `DONATION_MESSAGE` | La otra parte |
| `DONATION_DELIVERY_UPDATED` | Donante |

No existe endpoint publico de creacion: se generan desde el modulo Donations. Fallos de notificacion no rompen el flujo principal.

---

## Admin — `/admin`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/admin/dashboard` | ADMIN | KPIs, ultimas needs, campanas destacadas |

### Query

| Param | Default | Max |
| ----- | ------- | --- |
| `latestNeedsLimit` | 10 | 50 |
| `featuredCampaignsLimit` | 3 | 10 |

Detalle de KPIs: `docs/ADMIN_MODULE.md`.

---

## Errores frecuentes

| HTTP | Caso |
| ---- | ---- |
| 400 | Validacion Zod o transicion de estado invalida |
| 401 | Sin JWT o token invalido |
| 403 | Rol incorrecto / fundacion no operativa / no participante |
| 404 | Recurso inexistente o no perteneciente al usuario |

---

## Documentacion relacionada

| Recurso | Ruta |
| ------- | ---- |
| Vision general | `specs/API_OVERVIEW.md` |
| Specs por modulo | `specs/modules/*.md` |
| Campanas | `docs/CAMPAIGNS_MODULE.md` |
| Notificaciones | `docs/NOTIFICATIONS_MODULE.md` |
| Admin | `docs/ADMIN_MODULE.md` |
| Base de datos | `docs/DATABASE.md` |
| Swagger interactivo | `GET /api/v1/docs` |
