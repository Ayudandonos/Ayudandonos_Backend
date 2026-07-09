# Contribucion — Backend

## Flujo

1. Leer `AGENTS.md` y `docs/AI_WORKFLOW.md`
2. Consultar spec en `specs/modules/` antes de implementar
3. Seguir arquitectura por capas
4. Ejecutar `npm run build` y `npm run lint`
5. Actualizar specs y Swagger
6. Solicitar revision antes de merge

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
