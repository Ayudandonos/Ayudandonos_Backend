# Referencia de API — Ayudándonos Backend

**Base URL:** `/api/v1`  
**Swagger UI:** `/api/v1/docs`  
**Formato de respuesta:** `{ success, message, data, errors }`  
**Auth:** header `Authorization: Bearer <jwt>` cuando aplique

Este documento cubre auth/users, fundaciones (sedes), campanas, needs, donations, inventario, publicaciones de impacto, mensajeria, notificaciones y panel admin.

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

## Users — `/users`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/users/me` | JWT | Perfil propio + `donationStats` si rol `USER` |
| PATCH | `/users/me` | JWT | Actualizar campos de perfil |
| GET | `/users/:id` | admin o self | Detalle; incluye stats si es donante |
| PATCH | `/users/:id` | admin o self | Actualizar; admin tambien `role`/`isActive` |
| GET | `/users` | ADMIN | Listado paginado |
| DELETE | `/users/:id` | ADMIN | Soft deactivate |

### Campos de perfil (User)

`phone`, `city`, `department`, `bio`, `avatarUrl` (opcionales).

### Body `PATCH /users/me`

```json
{
  "fullName": "Nombre Apellido",
  "phone": "3001234567",
  "city": "Bogota",
  "department": "Cundinamarca",
  "bio": "Me gusta apoyar causas locales",
  "avatarUrl": "https://..."
}
```

### `donationStats` (solo rol USER)

```ts
{
  totalDonations: number,
  totalQuantity: number,
  receivedQuantity: number,
  cancelledDonations: number,
  byStatus: {
    COMMITTED: { count, quantity },
    RECEIVED: { count, quantity },
    CANCELLED: { count, quantity }
  }
}
```

`GET /auth/me` tambien expone los campos de perfil en `user` (sin stats).

---

## Locations geocode — `/locations/geocode`

JWT requerido. Geocodificacion estructurada (Nominatim) para preview de mapa y persistencia.

| Param | Notas |
| ----- | ----- |
| `street` | Direccion |
| `city` | Ciudad |
| `state` | Departamento |
| `country` | Pais |
| `q` | Texto libre (fallback) |

`street` sin `city`/`state` => 400. Sin match confiable => 404 (`NO_MATCH`).

Detalle: `docs/LOCATIONS_MODULE.md`.

---

## Foundations nearby — `/foundations/nearby`

Publico. Descubre fundaciones **verificadas** (`status === VERIFIED`) con al menos una **sede activa** con coordenadas en un radio de **1 a 10 km**.

Las fundaciones en `PENDING`, `REJECTED` o `SUSPENDED` **no aparecen**.

| Param | Tipo | Default | Notas |
| ----- | ---- | ------- | ----- |
| `latitude` | number | requerido | Origen (GPS del cliente) |
| `longitude` | number | requerido | Origen |
| `radiusKm` | number | 5 | Min 1, max 10 |

### Respuesta `data`

```ts
{
  radiusKm: 5,
  origin: { latitude, longitude },
  total: number,
  categories: [{ category: string, count: number }],
  items: [{
    id, name, acronym, category, city, logoUrl,
    latitude, longitude, distanceKm
  }]
}
```

Coordenadas: el backend puede geocodificar al guardar perfil (`PATCH /foundations/:id`)
desde `address` + `city`/`department`/`country`, o via `GET /locations/geocode`.  
Verificacion: `PATCH /foundations/:id/status` solo **ADMIN**. Sedes: `docs/FOUNDATIONS_MODULE.md`.
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
  "foundationBranchId": "uuid-sede-activa",
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-09-01T00:00:00.000Z",
  "imageUrl": null
}
```

La sede de entrega se define con `foundationBranchId` (sede activa de la fundacion). Al editar la sede, el snapshot de entrega en campanas publicadas se sincroniza.

Publicar (`status: PUBLISHED`) exige `startDate`, `endDate` (`endDate >= startDate`) y sede valida.

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
`fulfilledQuantity` se actualiza al confirmar recepcion (`RECEIVED`) segun `receivedQuantity`.

---

## Foundations branches — `/foundations/me/branches` y publico

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/foundations/me/branches` | FOUNDATION | Listar sedes propias |
| POST | `/foundations/me/branches` | FOUNDATION | Crear sede |
| PATCH | `/foundations/me/branches/:branchId` | FOUNDATION | Actualizar sede |
| POST | `/foundations/me/branches/:branchId/deactivate` | FOUNDATION | Desactivar sede |
| POST | `/foundations/me/branches/:branchId/activate` | FOUNDATION | Reactivar sede |
| GET | `/foundations/:id/branches` | Publico | Sedes activas de fundacion verificada |

Al registrar fundacion se crea sede principal `INACTIVE` con placeholders; al completar perfil (`PATCH /foundations/:id`) se sincronizan ciudad, departamento, direccion y telefono. La sede requiere horario de atencion para activarse.

Detalle: `docs/FOUNDATIONS_MODULE.md`.

---

## Donations — `/donations`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| POST | `/donations` | USER | Crear compromiso (+ chat; `initialMessage` opcional) |
| GET | `/donations/me` | USER | Listar propias |
| GET | `/donations/:id` | donor o foundation | Detalle con historial |
| PATCH | `/donations/:id/status` | donor / foundation | Cambiar estado (recepcion con inventario) |
| GET | `/donations/:id/messages` | participantes | Listar mensajes del chat |
| POST | `/donations/:id/messages` | participantes | Enviar mensaje |
| PATCH | `/donations/:id/messages/read` | participantes | Marcar conversacion como leida |
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

1. Se valida disponibilidad de la necesidad y campana publicada.
2. Se crea la donacion en `COMMITTED` con sede tomada de `campaign.foundationBranchId`.
3. Se abre `Conversation` 1:1 con preview (`lastMessageAt`, `unreadCount` en listados).
4. Si hay `initialMessage`, se inserta el primer mensaje.
5. Se notifica a la fundacion (`DONATION_CREATED` y, si aplica, `DONATION_MESSAGE`).

### Estados

`COMMITTED` → `RECEIVED` | `CANCELLED` (fundacion confirma recepcion o cancela)  
`COMMITTED` → `CANCELLED` (donante cancela)  
`RECEIVED` / `CANCELLED` terminales

Al pasar a `RECEIVED`, la fundacion puede enviar `receivedQuantity` (default: `quantity` del compromiso). Se registra entrada automatica de inventario en la misma transaccion.

Cada cambio queda en `donation_status_history`.

### PATCH `/donations/:id/status` — body (recepcion)

```json
{
  "status": "RECEIVED",
  "receivedQuantity": 5,
  "receptionNotes": "Productos en buen estado"
}
```

### Mensajes

Solo participantes de la donacion (donante o fundacion duena de la campana).

**Reglas de envio:**

- La conversacion se crea al comprometerse (`POST /donations`).
- La fundacion **no puede enviar el primer mensaje**; debe existir al menos un mensaje del donante (`initialMessage` al crear cuenta).
- No se permiten mensajes en donaciones `CANCELLED`.
- Body: 1–2000 caracteres, texto plano (trim).

```json
{ "body": "Confirmado, nos vemos a las 3pm" }
```

Notifica a la otra parte (`DONATION_MESSAGE`). Enlaces: donante → `/my-donations/chats/:id`; fundacion → `/foundation/messages/:id`.

Documentacion completa: `docs/MESSAGING_MODULE.md`. Flujo donaciones: `docs/DONATIONS_MODULE.md`.

---

## Inventory — `/inventory`

FOUNDATION operativa. Entradas solo automaticas al confirmar `RECEIVED`; salidas manuales con publicacion de impacto obligatoria.

| Metodo | Ruta | Descripcion |
| ------ | ---- | ----------- |
| GET | `/inventory/items` | Stock actual (solo lectura) |
| GET | `/inventory/movements` | Historial de movimientos paginado |
| GET | `/inventory/outbounds` | Historial de salidas paginado |
| POST | `/inventory/outbound` | Salida + post de impacto (min. 3 imagenes) |

Detalle: `docs/INVENTORY_MODULE.md`.

---

## Posts (impacto) — `/posts`

Publicaciones generadas por salidas de inventario. Listado publico y detalle por fundacion/campana.

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/posts` | Publico | Listado paginado |
| GET | `/posts/:id` | Publico | Detalle con imagenes |

Detalle: `docs/POSTS_MODULE.md`.

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

Tipos legacy `DONATION_DELIVERY_UPDATED` pueden existir en datos antiguos; el endpoint de entrega fue eliminado.

No existe endpoint publico de creacion: se generan desde el modulo Donations. Fallos de notificacion no rompen el flujo principal.

---

## Admin — `/admin`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/admin/dashboard` | ADMIN | KPIs, ultimas needs, campanas destacadas |
| GET | `/admin/reports` | ADMIN | Resumen y series para reportes administrativos |
| GET | `/admin/campaigns` | ADMIN | Listado administrativo de campanas |

### Query `GET /admin/dashboard`

| Param | Default | Max |
| ----- | ------- | --- |
| `latestNeedsLimit` | 10 | 50 |
| `featuredCampaignsLimit` | 3 | 10 |

Detalle de KPIs y reportes: `docs/ADMIN_MODULE.md`.

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
| Vision general | `docs/ARCHITECTURE.md` |
| Usuarios / perfil | `docs/USERS_MODULE.md` |
| Fundaciones (sedes + verificacion + nearby) | `docs/FOUNDATIONS_MODULE.md` |
| Campanas | `docs/CAMPAIGNS_MODULE.md` |
| Donaciones | `docs/DONATIONS_MODULE.md` |
| Inventario | `docs/INVENTORY_MODULE.md` |
| Publicaciones de impacto | `docs/POSTS_MODULE.md` |
| Mensajeria | `docs/MESSAGING_MODULE.md` |
| Notificaciones | `docs/NOTIFICATIONS_MODULE.md` |
| Admin | `docs/ADMIN_MODULE.md` |
| Seed / dataset demo | `docs/SEED.md` |
| Deploy Vercel | `docs/DEPLOYMENT_VERCEL.md` |
| Base de datos | `docs/DATABASE.md` |
| Swagger interactivo | `GET /api/v1/docs` |
