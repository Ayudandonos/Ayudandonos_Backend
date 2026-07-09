# Ayudándonos — Backend

API REST para la plataforma de donaciones en especie entre fundaciones verificadas y donantes.

**Repositorio:** https://github.com/Erickpe8/Ayudandonos_Backend

## Stack

Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Swagger.

## Inicio rapido

```bash
cp .env.example .env
npm install
npm run db:up          # PostgreSQL con Docker (opcional si ya tienes BD)
npm run prisma:generate
npm run db:setup       # Migraciones + administradores iniciales
npm run dev
```

Administradores creados por el seed (contraseña: `SEED_ADMIN_PASSWORD` en `.env`):

| Email | Nombre |
| ----- | ------ |
| apoyo_ud@fesc.edu.co | Diego Alexander Rincon Casarubia |
| tecnico_ud@fesc.edu.co | Erick Sebastian Perez Carvajal |

Sin Docker: configura `DATABASE_URL` en `.env` y ejecuta `npm run db:setup`.

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`
- Health: `http://localhost:3000/api/v1/health`

## Scripts

| Comando | Descripcion |
| ------- | ----------- |
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Ejecutar build de produccion |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Ejecutar migraciones |

## Desarrollo con IA

| Archivo | Proposito |
| ------- | --------- |
| [AGENTS.md](./AGENTS.md) | Instrucciones para agentes de IA |
| [docs/AI_WORKFLOW.md](./docs/AI_WORKFLOW.md) | Flujo de trabajo iterativo |
| [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md) | GitFlow: una rama por tarea |
| [specs/](./specs/) | Especificaciones tecnicas |
| [.cursor/skills/](./.cursor/skills/) | Skills del proyecto |

## Arquitectura

Capas: `Routes -> Controller -> Service -> Repository -> Prisma`

Ver [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Licencia

MIT
