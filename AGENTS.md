# Guia de desarrollo — Backend

Este archivo se mantiene por compatibilidad. La guia actual del equipo esta en:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md)
- [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md)
- Repo documentacion: `Ayudandonos_Documentacion` — `docs/00-meta/contributing-backend.md` y `docs/06-architecture/reglas-desarrollo.md`

## Contexto del proyecto

Plataforma para conectar fundaciones verificadas con donantes en especie. Sin pagos ni pasarelas. Comunicacion exclusiva via API REST versionada `/api/v1`.

**Estado:** MVP completado (fases 1–5). Modulos: auth, users, foundations, campaigns, needs, donations, notifications, admin, statistics.

**Repositorio relacionado:** Frontend en `https://github.com/Ayudandonos/Ayudandonos_Frontend`

## Arquitectura obligatoria

```
Routes -> Controller -> Service -> Repository -> Prisma
```

Ver [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) y [specs/](./specs/).
