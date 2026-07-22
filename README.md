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
| ericksperezc@gmail.com | Erick Sebastian Perez Carvajal |
| tecnico_ud@fesc.edu.co | Erick Sebastian Perez Carvajal |

El seed tambien crea (idempotente en cada deploy):

| Tipo | Detalle |
| ---- | ------- |
| Donantes | 8 usuarios `USER` con perfiles realistas |
| Fundaciones | UNICEF, Cruz Roja, Banco de Alimentos, TECHO, Fundacion Exito (+ 1 pendiente) |
| Campañas | Publicadas/finalizadas/borrador con needs y donaciones demo |

Contraseña compartida de donantes y cuentas de fundación demo: `SEED_DEMO_PASSWORD` o, por defecto, `AyudaDemo2026!`.

En cada deploy de Vercel se ejecuta `prisma db seed` automaticamente tras las migraciones.
El seed elimina la cuenta legacy `admin@gmail.com` si aun existiera.

Sin Docker: configura `DATABASE_URL` en `.env` y ejecuta `npm run db:setup`.

## Despliegue en Vercel

Ver [docs/DEPLOYMENT_VERCEL.md](./docs/DEPLOYMENT_VERCEL.md).

Variables minimas: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL del frontend).

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`
- Health: `http://localhost:3000/api/v1/health`

## Modulos API

| Recurso | Prefijo |
| ------- | ------- |
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Foundations | `/api/v1/foundations` |
| Campaigns | `/api/v1/campaigns` |
| Needs | `/api/v1/needs` |
| Donations | `/api/v1/donations` |
| Notifications | `/api/v1/notifications` |
| Admin (dashboard) | `/api/v1/admin` |

Catalogo consolidado: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md).  
Usuarios / perfil: [docs/USERS_MODULE.md](./docs/USERS_MODULE.md).  
Fundaciones (verificacion admin + nearby): [docs/FOUNDATIONS_MODULE.md](./docs/FOUNDATIONS_MODULE.md).  
Panel admin: [docs/ADMIN_MODULE.md](./docs/ADMIN_MODULE.md).  
Notificaciones: [docs/NOTIFICATIONS_MODULE.md](./docs/NOTIFICATIONS_MODULE.md).  
Campanas: [docs/CAMPAIGNS_MODULE.md](./docs/CAMPAIGNS_MODULE.md).

## Scripts

| Comando | Descripcion |
| ------- | ----------- |
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Ejecutar build de produccion |
| `npm run lint` | ESLint |
| `npm run test` | Pruebas unitarias e integracion |
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
