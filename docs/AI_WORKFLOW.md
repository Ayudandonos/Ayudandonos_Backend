# Flujo de trabajo con IA — Backend

## Proposito

Definir como los agentes de IA deben participar en el desarrollo del backend sin romper arquitectura ni avanzar fases sin aprobacion.

## Git por tarea

Antes de implementar, confirmar o crear la rama segun `docs/GIT_WORKFLOW.md`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/modulo-descripcion-tarea
```

Una rama por tarea. PR hacia `develop` al cerrar la iteracion.

## Flujo obligatorio por iteracion

1. **Analizar** el requerimiento y leer `AGENTS.md`, `specs/` y reglas en `docs/`.
2. **Diseñar** la solucion (endpoints, capas, validaciones, BD si aplica).
3. **Explicar** estrategia, archivos afectados e impacto.
4. **Implementar** solo lo solicitado.
5. **Verificar** `npm run build` y `npm run lint`.
6. **Documentar** cambios y actualizar `specs/` si corresponde.
7. **Esperar aprobacion** antes de la siguiente iteracion.

## Antes de escribir codigo

- Leer la spec del modulo en `specs/modules/`.
- Verificar si el endpoint ya esta en `specs/API_OVERVIEW.md`.
- Revisar `docs/DEVELOPMENT_RULES.md`.
- Usar skill `.cursor/skills/create-module/` para modulos nuevos.
- Usar skill `.cursor/skills/create-endpoint/` para endpoints nuevos.

## Checklist por endpoint nuevo

- [ ] Ruta en `*.routes.ts` bajo `/api/v1`
- [ ] Validacion Zod antes del controller
- [ ] Controller delega al service
- [ ] Service usa repository
- [ ] Respuesta con `ApiResponseBuilder`
- [ ] Errores con `AppError`
- [ ] Mensajes desde `API_MESSAGES` o `VALIDATION_MESSAGES`
- [ ] Documentacion Swagger en el archivo de rutas
- [ ] Comentarios JSDoc (Entrada/Proceso/Salida) en cada funcion
- [ ] Build y lint sin errores

## Prohibiciones

- Cambiar arquitectura sin autorizacion.
- Logica de negocio en controllers.
- Consultas Prisma fuera de repositories.
- Nombres en espanol en codigo.
- Emojis en cualquier artefacto.
- Commits con secretos (`.env`).

## Fases del proyecto

| Fase | Estado | Alcance |
| ---- | ------ | ------- |
| 1 | COMPLETADO | Configuracion, skeleton, health |
| 2 | COMPLETADO | BD, auth JWT, usuarios, seed ADMIN |
| 3 | COMPLETADO | Fundaciones, documentos, verificacion admin |
| 4 | COMPLETADO | Campanas, needs, donations, chat, delivery |
| 5 | COMPLETADO | Notificaciones in-app |
| — | COMPLETADO | Perfil donante + stats; foundations nearby |
| — | COMPLETADO | Panel admin (dashboard, reports, campaigns) |
| — | COMPLETADO | Seed demo con reset total en cada deploy |
| — | PENDIENTE | Storage cloud (Blob/S3) |

Detalle del seed: `docs/SEED.md`. Deploy: `docs/DEPLOYMENT_VERCEL.md`.
