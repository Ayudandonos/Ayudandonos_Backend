# Modulo Notificaciones — Backend

Estado: **IMPLEMENTADO** (Fase 5).

## Endpoints

Base: `/api/v1/notifications` (JWT requerido)

| Metodo | Ruta | Descripcion |
| ------ | ---- | ----------- |
| GET | `/` | Listado paginado; query `unreadOnly` |
| GET | `/unread-count` | `{ unreadCount }` |
| PATCH | `/read-all` | Marca todas leidas; `{ updatedCount }` |
| PATCH | `/:id/read` | Marca una leida |

## Eventos que generan notificacion

| Evento | Destinatario | Tipo |
| ------ | ------------ | ---- |
| Nueva donacion | Usuario de la fundacion | `DONATION_CREATED` |
| Cambio de estado | La otra parte (donante o fundacion) | `DONATION_STATUS_CHANGED` |
| Nuevo mensaje (incluye `initialMessage`) | La otra parte | `DONATION_MESSAGE` |
| Actualizacion de entrega | Donante | `DONATION_DELIVERY_UPDATED` |

## Modelo

Tabla `notifications`: userId, type, title, body, linkPath, resourceType, resourceId, isRead, readAt, createdAt.

## Resiliencia

Los hooks desde Donations capturan errores de notificacion y no abortan el flujo principal.

## Documentacion

- Spec: `specs/modules/notifications.md`
- Catalogo API: `docs/API_REFERENCE.md`
- Swagger: tag `Notifications` en `/api/v1/docs`
