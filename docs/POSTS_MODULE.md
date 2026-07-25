# Modulo Publicaciones de impacto (Posts)

## Proposito

Documentar entregas comunitarias realizadas desde salidas de inventario. Cada salida (`POST /inventory/outbound`) genera obligatoriamente un post con minimo 3 imagenes.

## Origen de datos

Los posts **no se crean directamente** por API publica. Se generan en la transaccion de salida de inventario (`inventory.service.registerOutbound`).

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/posts` | Publico | Listado paginado de publicaciones |
| GET | `/posts/:id` | Publico | Detalle con imagenes y metadatos |

## Query listado

| Param | Tipo | Notas |
| ----- | ---- | ----- |
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |
| `foundationId` | uuid | Filtrar por fundacion |
| `campaignId` | uuid | Filtrar por campana |

## Trazabilidad

```
Necesidad -> Campana -> Compromiso -> RECEIVED -> IN inventario -> Salida OUT -> Post impacto
```

Ver tambien: `docs/INVENTORY_MODULE.md`, `docs/DONATIONS_MODULE.md`.
