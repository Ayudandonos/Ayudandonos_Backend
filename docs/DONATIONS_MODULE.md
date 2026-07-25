# Modulo Donaciones

## Flujo oficial

1. Donante compromete donacion (`POST /donations`) sobre una necesidad de campana publicada.
2. La sede se toma automaticamente de `campaign.foundationBranchId` (snapshot en `donations.foundation_branch_id`).
3. Se crea conversacion 1:1 donante-fundacion.
4. Donante lleva productos personalmente a la sede.
5. Fundacion confirma recepcion (`PATCH /donations/:id/status` con `status: RECEIVED`).
6. Al confirmar RECEIVED se registra entrada automatica de inventario en la misma transaccion.

## Estados

| Estado | Descripcion |
|--------|-------------|
| COMMITTED | Compromiso activo; donante puede cancelar |
| RECEIVED | Fundacion confirmo recepcion en sede |
| CANCELLED | Compromiso cancelado (ajusta fulfilledQuantity) |

Transiciones fundacion: `COMMITTED -> RECEIVED | CANCELLED`.  
Transiciones donante: `COMMITTED -> CANCELLED`.

## Endpoints

| Metodo | Ruta | Rol |
|--------|------|-----|
| POST | `/donations` | USER |
| GET | `/donations/me` | USER |
| GET | `/donations/:id` | USER / FOUNDATION (participante) |
| PATCH | `/donations/:id/status` | USER (cancelar) / FOUNDATION (recibir/cancelar) |
| GET/POST | `/donations/:id/messages` | Participantes |
| GET | `/foundation/requests` | FOUNDATION operativa |

## Payload recepcion

```json
{
  "status": "RECEIVED",
  "receivedQuantity": 5,
  "receptionNotes": "Productos en buen estado"
}
```

`receivedQuantity` es opcional; por defecto usa `quantity` del compromiso.

## Prohibido (eliminado)

- `PATCH /donations/:id/delivery`
- Estados `IN_TRANSIT`, `DELIVERED`, `CONFIRMED`
- Campos `deliveryAddress`, `deliveryLatitude`, `deliveryLongitude` en donaciones
