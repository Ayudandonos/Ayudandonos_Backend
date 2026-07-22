# Modulo Usuarios — Backend

Estado: **IMPLEMENTADO** (perfil donante + estadisticas de donaciones).

## Endpoints

Base: `/api/v1/users` (JWT requerido)

| Metodo | Ruta | Auth | Descripcion |
| ------ | ---- | ---- | ----------- |
| GET | `/me` | JWT | Perfil propio; incluye `donationStats` si rol `USER` |
| PATCH | `/me` | JWT | Actualizar campos de perfil propios |
| GET | `/:id` | admin o self | Detalle; stats si el usuario es donante |
| PATCH | `/:id` | admin o self | Actualizar; admin tambien `role` / `isActive` |
| GET | `/` | ADMIN | Listado paginado |
| DELETE | `/:id` | ADMIN | Soft deactivate (`isActive = false`) |

`GET /auth/me` expone los mismos campos de perfil en `user` (sin `donationStats`).

## Campos de perfil (`User`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| fullName | string | Editable |
| phone | string? | |
| city | string? | |
| department | string? | |
| bio | string? | Max 500 |
| avatarUrl | string? | URL (upload cloud en Storage) |

## `donationStats` (solo `USER`)

```ts
{
  totalDonations: number,
  totalQuantity: number,        // sum quantity no canceladas
  deliveredQuantity: number,    // DELIVERED + CONFIRMED
  cancelledDonations: number,
  byStatus: {
    COMMITTED: { count, quantity },
    IN_TRANSIT: { count, quantity },
    DELIVERED: { count, quantity },
    CONFIRMED: { count, quantity },
    CANCELLED: { count, quantity }
  }
}
```

Si el rol no es `USER`, `donationStats` es `null`.

## Reglas

1. Un usuario no puede ver ni editar perfiles de terceros (salvo ADMIN).
2. Solo ADMIN puede cambiar `role` e `isActive`.
3. Las stats se calculan en el repository de Donations (`getDonorStats`).

## Capas

```
src/modules/users/
```

Catalogo: `docs/API_REFERENCE.md`.
