# Convenciones de codigo — Backend

## Idioma

| Elemento | Idioma |
| -------- | ------ |
| Identificadores de codigo | Ingles |
| Comentarios de funciones | Espanol en bloque JSDoc unico (Entrada/Proceso/Salida) |
| Documentacion | Espanol |
| Mensajes al usuario (API) | Espanol en `API_MESSAGES` |

## Comentarios obligatorios

Toda funcion, metodo, servicio, repositorio, controlador, middleware y utilidad debe documentarse con **un unico bloque JSDoc** en espanol:

```typescript
/**
 * Entrada: Describe de forma clara los parametros o datos que recibe la funcion.
 * Proceso: Explica brevemente la responsabilidad y el comportamiento de la funcion.
 * Salida: Describe el valor retornado o el efecto que produce la funcion.
 */
```

No usar comentarios de linea (`//`) ni bloques separados para Entrada, Proceso o Salida.

## Nomenclatura de archivos

| Tipo | Patron |
| ---- | ------ |
| Controller | `<modulo>.controller.ts` |
| Service | `<modulo>.service.ts` |
| Repository | `<modulo>.repository.ts` |
| Routes | `<modulo>.routes.ts` |
| Validations | `<modulo>.validations.ts` |
| DTO | `<modulo>.dto.ts` |

## Commits (Conventional Commits)

```
feat: add login endpoint
fix: correct email validation
docs: update API spec
chore: configure prisma
```

## API

- Rutas plurales: `/users`, `/campaigns`
- Versionado: `/api/v1/`
- Respuesta estandar con `ApiResponseBuilder`

## Estilo

- Sin emojis
- Lenguaje profesional y corporativo
