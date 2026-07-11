# Instrucciones para agentes de IA — Backend Ayudándonos

Este repositorio contiene la API REST del proyecto **Ayudándonos**. Lee este archivo antes de modificar codigo.

## Contexto del proyecto

Plataforma para conectar fundaciones verificadas con donantes en especie. Sin pagos ni pasarelas. Comunicacion exclusiva via API REST versionada `/api/v1`.

**Repositorio relacionado:** Frontend en `https://github.com/Erickpe8/Ayudandonos_Frontend`

## Stack

Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Zod, Swagger, Helmet, CORS, Rate Limit.

## Arquitectura obligatoria

```
Routes -> Controller -> Service -> Repository -> Prisma
```

- **Controller:** solo HTTP; sin logica de negocio.
- **Service:** logica de negocio; lanza `AppError`.
- **Repository:** unica capa con acceso a Prisma.
- **Validations:** esquemas Zod en `*.validations.ts`.
- **DTO:** tipos de entrada/salida en `*.dto.ts`.

## Reglas no negociables

1. Codigo en **ingles**; documentacion y comentarios en **espanol**.
2. Comentarios en funciones: **un unico bloque JSDoc** con lineas `Entrada`, `Proceso` y `Salida` (ver `docs/CONVENTIONS.md`).
3. Sin emojis en ningun artefacto.
4. Mensajes al usuario en `src/shared/constants/messages.constants.ts`.
5. Respuesta API: `{ success, message, data, errors }`.
6. No reorganizar carpetas sin autorizacion.
7. No implementar funcionalidades no solicitadas (YAGNI).
8. Documentar endpoints en Swagger al crearlos.
9. Esperar aprobacion antes de avanzar de fase.
10. Trabajar en rama `feature/*` (una tarea por rama); PR hacia `develop`. Ver `docs/GIT_WORKFLOW.md`.

## Git (GitFlow por tarea)

- `main`: estable. `develop`: integracion.
- Crear `feature/<modulo>-<tarea>` desde `develop` antes de codificar.
- No mezclar tareas en la misma rama ni commitear directo en `main`.

## Estructura de modulos

Cada modulo en `src/modules/<nombre>/`:

```
<nombre>.controller.ts
<nombre>.service.ts
<nombre>.repository.ts
<nombre>.routes.ts
<nombre>.validations.ts
<nombre>.dto.ts
index.ts
```

## Fase actual

**Fase 1 COMPLETADA:** configuracion base, skeleton de modulos, health check.

**Fase 2 COMPLETADA:** Auth JWT, usuarios, seed ADMIN, Docker PostgreSQL.

**Fase 3 — Fundaciones COMPLETADA:** perfil extendido, documentos, verificacion admin, historial de observaciones (backend + frontend).

**Siguiente:** Campanas (tras commit/push aprobado de fundaciones).

## Documentacion interna

| Recurso | Ruta |
| ------- | ---- |
| Flujo de trabajo con IA | `docs/AI_WORKFLOW.md` |
| Arquitectura | `docs/ARCHITECTURE.md` |
| Convenciones | `docs/CONVENTIONS.md` |
| Reglas de desarrollo | `docs/DEVELOPMENT_RULES.md` |
| Especificaciones API | `specs/API_OVERVIEW.md` |
| Plantilla de modulo | `specs/MODULE_TEMPLATE.md` |
| Skills del proyecto | `.cursor/skills/` |

## Comandos utiles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm run lint         # ESLint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed       # Administradores iniciales (requiere SEED_ADMIN_PASSWORD)
```

## Variables de entorno

Copiar `.env.example` a `.env`. Nunca commitear `.env`.
