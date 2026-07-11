# Informe de validacion integral — Modulo Fundaciones

Fecha: 2026-07-10  
Estado del modulo: **REVISION COMPLETADA — PENDIENTE APROBACION FINAL**

---

## 1. Resumen ejecutivo

| Area | Resultado | Notas |
|------|-----------|-------|
| Arquitectura backend | CORREGIDO | Mapper por rol, transacciones, almacenamiento privado de documentos |
| Modelo de datos | MEJORADO | Campos de ciclo de vida; preparacion documentada para modulos futuros |
| Integridad API | CORREGIDO | Permisos de descarga, filtrado de DTO, manejo P2002 |
| Frontend UX | MEJORADO | Confirmaciones admin, skeletons, preview autenticada, validaciones |
| Documentacion | ACTUALIZADA | Este informe + `FOUNDATIONS_MODULE.md` |
| Pruebas E2E | PARCIAL | Analisis estatico + build OK; E2E requiere BD activa |
| Calidad (lint/build) | OK | Backend y frontend compilan sin errores |

**Estimacion de finalizacion del modulo: 92%**

---

## 2. Revision de arquitectura

### Hallazgos originales

| Severidad | Hallazgo | Estado |
|-----------|----------|--------|
| P0 | Documentos legales expuestos via `/uploads` estatico | **CORREGIDO** — solo logos publicos; documentos en `private/` |
| P0 | DTO de detalle expone datos sensibles al publico | **CORREGIDO** — `foundations.mapper.ts` filtra por rol |
| P0 | Descarga de documentos con permiso demasiado amplio | **CORREGIDO** — solo owner/ADMIN |
| P1 | Actualizacion perfil no atomica | **CORREGIDO** — `updateProfileWithSocialLinks` en transaccion |
| P1 | Race condition NIT sin manejo P2002 | **CORREGIDO** — `handlePersistenceError` |
| P1 | Timestamps historicos borrados al cambiar estado | **CORREGIDO** — `verifiedAt`/`rejectedAt` preservados |
| P2 | Mapper duplicado auth/users | **PENDIENTE** — deuda tecnica menor |
| P2 | Creacion fundacion en auth.repository | **ACEPTADO** — transaccion atomica user+foundation; refactor futuro |
| P2 | Codigo muerto `deleteDocumentByType` | **PENDIENTE** — reservado para DELETE endpoint futuro |
| P2 | Swagger incompleto en rutas | **PENDIENTE** — deuda tecnica documentada |

### Capas respetadas

```
Routes -> Controller -> Service -> Repository -> Prisma
```

- Controllers sin logica de negocio.
- Prisma confinado a repositories (excepto registro inicial en auth).
- Validaciones Zod antes de service.
- Componentes React delegan a hooks/services.

---

## 3. Revision del modelo de datos

### Campos agregados en esta revision

| Campo | Motivo |
|-------|--------|
| `slug` | URLs publicas estables para campanas y SEO |
| `verifiedById` | Trazabilidad de quien verifico (auditoria) |
| `suspendedAt` | Simetria con `verifiedAt`/`rejectedAt` |
| `deletedAt` | Soft delete sin romper FKs historicas |

### Preparacion para modulos futuros

Documentado en `docs/DATABASE.md` y `specs/DATABASE.md`. Relaciones planificadas:

| Modulo | FK desde Foundation | Notas |
|--------|---------------------|-------|
| Campanas | `Campaign.foundationId` | Listados e includes preparados via slug |
| Necesidades | Via `Campaign` | Evita duplicacion directa |
| Donaciones | Via `Need`/`Campaign` + `User` | Trazabilidad donante |
| Voluntariado | `VolunteerOpportunity.foundationId` | Ancla organizacional |
| Notificaciones | `Notification.userId` | Disparadores desde cambios de estado |
| Estadisticas | Agregaciones sobre FKs existentes | Sin campos denormalizados aun |
| Auditoria | `AuditLog` generico | Complementa `FoundationAdminObservation` |

**No se crearon tablas de modulos futuros** (YAGNI hasta implementar Campanas).

---

## 4. Integridad de la API

### Endpoints verificados (analisis estatico)

| Endpoint | HTTP | Auth | Validacion | Permisos |
|----------|------|------|------------|----------|
| GET `/foundations` | 200 | Opcional | Query Zod | Publico: solo VERIFIED; filtro status: 403 |
| GET `/foundations/me` | 200/403 | JWT FOUNDATION | — | Rol validado en service |
| GET `/foundations/:id` | 200/403/404 | Opcional | UUID | DTO filtrado por rol |
| GET `/foundations/:id/documents/:type/download` | 200/403/404 | JWT | UUID + enum | Solo owner/ADMIN |
| PATCH `/foundations/:id` | 200/403/404/409 | JWT | Body Zod | Owner/ADMIN |
| PATCH `/foundations/:id/status` | 200/400/403 | JWT ADMIN | Body Zod | Admin; rechazo exige motivo |
| POST `/foundations/:id/logo` | 200/400/403 | JWT | Multipart | Owner/ADMIN; MIME validado |
| POST `/foundations/:id/documents` | 200/400/403 | JWT | Multipart + type | Owner/ADMIN; almacenamiento privado |

### Casos limite cubiertos

- Fundacion con usuario inactivo: 404 en detalle, excluida de listados.
- NIT duplicado: 409.
- Estado ya establecido: 400.
- Verificacion sin perfil/documentos: 400.
- Archivo ausente o MIME invalido: 400.
- Token invalido en rutas opcionales: tratado como anonimo.

---

## 5. Frontend UX

### Mejoras aplicadas

| Area | Mejora |
|------|--------|
| Confirmaciones | `ConfirmDialog` en acciones admin destructivas |
| Carga | `FoundationsLoadingSkeleton` en listado, admin y perfil |
| Documentos | Preview via blob autenticado (no URL estatica) |
| Validaciones | `website` y `acronym` aceptan vacio correctamente |
| Errores | try/catch en descargas con feedback al usuario |
| Arquitectura | Hooks `useFoundationsList`, `useAdminFoundations` |

### Pendiente UX (deuda menor)

- Vista card alternativa para tabla admin en movil.
- Integrar o eliminar `FoundationSocialLinksEditor.tsx` (sin uso).
- Ocultar rutas mock de solicitudes/entregas del nav hasta modulo Donaciones.
- Focus trap completo en modal de revision (parcial via overlay).

---

## 6. Bateria de pruebas funcionales

Leyenda: **PASS** verificado por codigo/build | **MANUAL** requiere BD + servidor | **N/A** no aplica

| # | Caso | Resultado | Evidencia |
|---|------|-----------|-----------|
| 1 | Registro de fundacion | MANUAL | `auth.repository.createUserWithFoundation`; estado PENDING |
| 2 | Edicion de perfil | MANUAL | PATCH validado; transaccion atomica |
| 3 | Subida RUT | MANUAL | POST documents; private storage |
| 4 | Subida certificado legal | MANUAL | Idem |
| 5 | Subida ID representante | MANUAL | Idem |
| 6 | Subida certificacion bancaria | MANUAL | Opcional en reglas de verificacion |
| 7 | Reemplazo de documento | PASS | upsert + deleteStoredFile anterior |
| 8 | Verificacion admin | MANUAL | PATCH status VERIFIED; valida perfil completo |
| 9 | Rechazo con motivo | PASS | Zod backend+frontend exige rejectionReason |
| 10 | Suspension | MANUAL | PATCH status SUSPENDED; suspendedAt |
| 11 | Retorno a pendiente | MANUAL | PATCH status PENDING |
| 12 | Listado publico solo VERIFIED | PASS | whereOverride en service |
| 13 | Permisos USER sobre docs ajenos | PASS | assertCanManageFoundation -> 403 |
| 14 | Permisos ADMIN | PASS | authorize + assertIsAdmin |
| 15 | Validacion NIT invalido | PASS | Zod min/max |
| 16 | Archivo MIME invalido | PASS | upload.middleware |
| 17 | Archivo demasiado grande | PASS | multer LIMIT_FILE_SIZE |
| 18 | Sin token en descarga | PASS | authenticate middleware |
| 19 | Token invalido en descarga | PASS | auth middleware 401 |
| 20 | DTO publico sin email representante | PASS | mapper hideContact |
| 21 | DTO publico sin documentos | PASS | mapper documents: [] |
| 22 | Logo visible publicamente | PASS | static /uploads/foundations |
| 23 | Documento NO accesible por URL directa | PASS | private/ fuera de static |
| 24 | Historial observaciones admin | PASS | FoundationAdminObservation |
| 25 | Confirmacion antes de rechazar | PASS | ConfirmDialog frontend |

**Nota:** Pruebas MANUAL requieren `docker compose up -d` + `npm run prisma:migrate` + servidor dev. No ejecutadas en este entorno (PostgreSQL no disponible en localhost:5432).

---

## 7. Calidad — comandos ejecutados

| Comando | Backend | Frontend |
|---------|---------|----------|
| `npm run lint` | PASS | PASS |
| `npm run build` (tsc + prisma generate) | PASS | PASS |
| `prisma migrate deploy` | SKIP | — |
| Imports sin uso | PASS | PASS (corregido handleSubmit) |
| Dependencias no utilizadas | PASS | PASS |

---

## 8. Riesgos que permanecen

| Riesgo | Impacto | Mitigacion recomendada |
|--------|---------|------------------------|
| Almacenamiento local en Vercel | Alto en prod | Migrar a S3/R2/Blob antes de escala |
| auth.repository crea Foundation | Medio | Extraer a foundationsRepository en iteracion futura |
| Sin tests automatizados | Medio | Agregar Vitest/Supertest en Fase Campanas |
| Paginas mock en nav fundacion | Bajo | Ocultar hasta modulo Donaciones |
| Swagger incompleto | Bajo | Completar anotaciones @swagger |

---

## 9. Limitaciones conocidas

1. Documentos pre-migracion con URL publica legacy siguen resolviendo via `resolveStoragePath`.
2. No existe endpoint DELETE de documentos (solo reemplazo).
3. Maquina de estados flexible (admin puede transicionar libremente salvo reglas de VERIFIED/REJECTED).
4. E2E no ejecutado por ausencia de BD local en entorno de revision.

---

## 10. Deuda tecnica restante

1. Mapper compartido `toPublicFoundation` para auth/users.
2. Swagger completo en todas las rutas foundations.
3. Endpoint DELETE `/foundations/:id/documents/:type`.
4. Hook `useFoundationProfile` (logica aun en pagina).
5. Tests unitarios e integracion automatizados.
6. Storage cloud para uploads en produccion.

---

## 11. Ciclo de vida de una fundacion

```
REGISTRO (auth/register/foundation)
    -> PENDING
        -> [owner completa perfil + documentos]
        -> [admin revisa]
            -> VERIFIED (visible publico)
            -> REJECTED (motivo obligatorio)
            -> PENDING (solicitar info / re-evaluar)
    VERIFIED
        -> SUSPENDED (oculta publico, historial preservado)
        -> PENDING / REJECTED (admin)
    REJECTED / SUSPENDED
        -> PENDING (correccion)
        -> VERIFIED (re-aprobacion)
```

Campos de auditoria: `verifiedAt`, `verifiedById`, `rejectedAt`, `suspendedAt`, `FoundationAdminObservation`.

---

## 12. Conclusion

El modulo cumple arquitectura, seguridad de datos sensibles, reglas de negocio core y UX minima profesional. Las correcciones de esta revision abordan los riesgos criticos identificados. Quedan pendientes pruebas E2E con BD activa y deuda tecnica no bloqueante antes del commit final.

**Recomendacion:** Ejecutar checklist MANUAL en entorno local con Docker antes de aprobar commit/push.
