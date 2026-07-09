---
name: create-backend-endpoint
description: Agregar un endpoint REST al backend Ayudandonos. Usar al crear rutas nuevas en modulos existentes.
---

# Crear endpoint backend

## Cuando usar

Al agregar un endpoint a un modulo existente en `src/modules/<nombre>/`.

## Pasos

1. Actualizar `specs/modules/<nombre>.md` con metodo, ruta, body, respuestas y roles.
2. Actualizar `specs/API_OVERVIEW.md`.
3. Agregar esquema Zod en `*.validations.ts` si hay body/query.
4. Agregar metodo en repository (consulta Prisma).
5. Agregar metodo en service (logica de negocio).
6. Agregar handler en controller (delegar al service).
7. Registrar ruta en `*.routes.ts` con middlewares: validate, authenticate, authorize.
8. Documentar en Swagger con bloque `@swagger` en routes.
9. Verificar build y lint.

## Respuesta

```typescript
res.status(200).json(ApiResponseBuilder.success(data, API_MESSAGES.SUCCESS_DEFAULT));
```

## Errores

```typescript
throw new AppError(API_MESSAGES.AUTH_FORBIDDEN, 403);
```
