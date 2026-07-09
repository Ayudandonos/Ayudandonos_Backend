---
name: create-backend-module
description: Crear o completar un modulo backend siguiendo la arquitectura por capas de Ayudandonos. Usar al implementar un nuevo dominio o CRUD en src/modules/.
---

# Crear modulo backend

## Cuando usar

Al implementar un nuevo modulo en `src/modules/<nombre>/` o completar un skeleton existente.

## Pasos

1. Leer `specs/MODULE_TEMPLATE.md` y crear/actualizar `specs/modules/<nombre>.md`.
2. Definir endpoints en `specs/API_OVERVIEW.md`.
3. Crear archivos si no existen:
   - `<nombre>.dto.ts`
   - `<nombre>.validations.ts` (Zod, mensajes desde VALIDATION_MESSAGES)
   - `<nombre>.repository.ts`
   - `<nombre>.service.ts`
   - `<nombre>.controller.ts`
   - `<nombre>.routes.ts` (con anotaciones Swagger)
   - `index.ts`
4. Registrar rutas en `src/routes/index.ts`.
5. Comentarios Entrada/Proceso/Salida en cada funcion.
6. Ejecutar `npm run build` y `npm run lint`.

## Reglas

- Controller sin logica de negocio.
- Service lanza AppError.
- Repository unico acceso a Prisma.
- Mensajes desde API_MESSAGES / VALIDATION_MESSAGES.
- Sin emojis.
