# Modulo Campanas — Backend

Estado: **IMPLEMENTADO** (Fase 4).

## Endpoints

Base: `/api/v1/campaigns`

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/` | Publico | Listado paginado de campanas `PUBLISHED` |
| GET | `/me` | JWT FOUNDATION + operativa | Campanas propias |
| GET | `/:id` | Opcional | Detalle publico si `PUBLISHED`; owner ve propias |
| POST | `/` | JWT FOUNDATION + operativa | Crear (`DRAFT` por defecto) |
| PATCH | `/:id` | JWT FOUNDATION + operativa | Actualizar propia |
| DELETE | `/:id` | JWT FOUNDATION + operativa | Soft delete |

## Estados

`DRAFT` → `PUBLISHED` | `CANCELLED`  
`PUBLISHED` → `FINISHED` | `CANCELLED`  
`FINISHED` / `CANCELLED` inmutables

Publicar requiere `startDate` y `endDate` con `endDate >= startDate`.

Punto de entrega opcional: `deliveryAddress`, `deliveryLatitude`, `deliveryLongitude`.

## Modulos relacionados

- Needs: necesidades por campana
- Donations: compromisos, chat, entrega con mapa
- Notifications: eventos in-app desde donaciones
- Spec: `specs/modules/campaigns.md`
- Catalogo API: `docs/API_REFERENCE.md`
