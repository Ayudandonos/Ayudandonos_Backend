# Contribucion — Backend

## Git (GitFlow por tarea)

Usamos una rama por tarea. Detalle completo en [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md).

| Rama | Uso |
| ---- | --- |
| `main` | Estable / produccion |
| `develop` | Integracion de tareas |
| `feature/*` | Una tarea o iteracion |
| `fix/*` | Correcciones sobre develop |
| `hotfix/*` | Urgente desde main |

Inicio de tarea:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/modulo-descripcion
```

Al terminar: push, PR hacia `develop`, revision y merge. No commitear directo en `main`.

## Flujo de desarrollo

1. Leer `AGENTS.md` y `docs/AI_WORKFLOW.md`
2. Crear o usar rama `feature/*` para la tarea
3. Consultar spec en `specs/modules/` antes de implementar
4. Seguir arquitectura por capas
5. Ejecutar `npm run build` y `npm run lint`
6. Actualizar specs y Swagger
7. Solicitar revision antes de merge a `develop`

## Commits

Formato Conventional Commits en espanol o ingles tecnico:

```
feat(auth): implement login endpoint
fix(users): correct role validation
docs(specs): update API overview
```

## Pull requests

Incluir:

- Que se hizo y por que
- Endpoints afectados
- Impacto en BD (si aplica)
- Resultado de build y lint

## Secretos

Nunca commitear `.env`. Usar `.env.example` como plantilla.

## Seed y produccion

Cada deploy de Vercel ejecuta `prisma db seed`, que **vacia** la BD y deja solo el dataset demo.
No depender de datos manuales en produccion mientras este comportamiento este activo.
Detalle: [docs/SEED.md](./docs/SEED.md).
