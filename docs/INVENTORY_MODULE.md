# Modulo Inventario y publicaciones

## Reglas

- **Entradas:** solo automaticas al confirmar recepcion de donacion (`RECEIVED`).
- **Salidas:** fundacion registra `POST /inventory/outbound` con post obligatorio (min. 3 imagenes).
- **Trazabilidad:** movimientos IN/OUT con `donationId`, `campaignId`, `foundationBranchId` cuando aplica.

## Endpoints inventario

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/inventory/items` | Stock actual (solo lectura) |
| GET | `/inventory/movements` | Historial de movimientos paginado |
| GET | `/inventory/outbounds` | Historial de salidas paginado |
| POST | `/inventory/outbound` | Salida + publicacion de impacto |

## Prohibido (eliminado)

- `POST /inventory/items` (crear producto manual)
- `POST /inventory/items/:id/stock-in` (entrada manual)
- `PATCH /inventory/items/:id`

## Salida (outbound)

Multipart con campo `payload` (JSON):

```json
{
  "campaignId": "uuid",
  "foundationBranchId": "uuid",
  "title": "Entrega comunitaria",
  "description": "Descripcion publica",
  "observations": "Notas internas opcionales",
  "lines": [{ "inventoryItemId": "uuid", "quantity": 10 }]
}
```

Mas minimo 3 archivos en `images`.

## Cadena de trazabilidad

```
Necesidad -> Campana -> Compromiso -> RECEIVED -> IN automatico -> Salida OUT -> Post impacto
```
