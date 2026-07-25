# Reglas de desarrollo — Backend

Reglas obligatorias para humanos y agentes de IA.

## Arquitectura

- Capas: Routes -> Controller -> Service -> Repository -> Prisma
- Sin logica de negocio en controllers
- Sin Prisma fuera de repositories
- No reorganizar carpetas sin autorizacion

## Calidad

- SOLID, Clean Code, DRY, KISS, YAGNI
- Una responsabilidad por funcion
- Validar toda entrada con Zod
- Nunca confiar en datos del cliente

## Idioma

- Codigo en ingles
- Documentacion y comentarios en espanol
- Bloque JSDoc unico con Entrada/Proceso/Salida en funciones (ver `docs/CONVENTIONS.md`)

## Comunicacion

- Sin emojis
- Estados en docs: COMPLETADO, PARCIAL, PENDIENTE

## API

- Versionado `/api/v1`
- Respuesta `{ success, message, data, errors }`
- Swagger en endpoints nuevos
- Mensajes en `messages.constants.ts`

## Flujo de trabajo

1. Rama `feature/*` desde `develop` (ver `docs/GIT_WORKFLOW.md`)
2. Analizar 3. Disenar 4. Explicar 5. Implementar 6. build + lint 7. Documentar 8. PR a `develop` 9. Esperar aprobacion

## Desarrollo local (Windows)

Si `npm run build` falla con `EPERM` en `prisma generate`, detenga `npm run dev` antes de compilar. El script `scripts/prisma-generate.mjs` reintenta hasta 3 veces; use `npm run prisma:generate` por separado si persiste el bloqueo del cliente Prisma.

## Prohibido sin autorizacion

- Cambiar arquitectura
- Eliminar codigo sin justificar
- Codigo no solicitado
- Dependencias innecesarias
