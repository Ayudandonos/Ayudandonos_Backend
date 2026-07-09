# Convenciones de codigo — Backend

## Idioma

| Elemento | Idioma |
| -------- | ------ |
| Identificadores de codigo | Ingles |
| Comentarios de funciones | Espanol (Entrada/Proceso/Salida) |
| Documentacion | Espanol |
| Mensajes al usuario (API) | Espanol en `API_MESSAGES` |

## Comentarios obligatorios

```javascript
// Entrada:
// ...

// Proceso:
// ...

// Salida:
// ...
```

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
