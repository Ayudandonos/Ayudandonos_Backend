# Seed de datos — Backend

Archivos: `prisma/seed.ts` (logica) y `prisma/seed-data.ts` (dataset).

## Comportamiento

Cada ejecucion de `prisma db seed`:

1. **Vacia** todas las tablas de negocio con `TRUNCATE ... CASCADE`.
2. **Crea** unicamente el dataset definido en `seed-data.ts`.

No es idempotente por upsert: siempre deja la BD exactamente igual al seed.

### Tablas truncadas

`notifications`, `messages`, `conversations`, `donation_status_history`, `donations`, `needs`, `campaigns`, `foundation_admin_observations`, `foundation_documents`, `foundation_social_links`, `foundations`, `users`.

### Cuando se ejecuta

| Contexto | Comando / momento |
| -------- | ----------------- |
| Local | `npm run prisma:seed` o `npm run db:setup` |
| Vercel (cada deploy) | `scripts/vercel-build.mjs` tras `migrate deploy` |

**Advertencia:** en produccion, cualquier dato creado fuera del seed se pierde en el siguiente deploy.

## Variables de entorno

| Variable | Obligatoria | Uso |
| -------- | ----------- | --- |
| `SEED_ADMIN_PASSWORD` | Si (min. 8) | Password de los 3 administradores |
| `SEED_DEMO_PASSWORD` | No | Password de donantes y cuentas de fundacion demo; por defecto `AyudaDemo2026!` |

## Dataset

### Administradores (`ADMIN`)

| Email | Nombre |
| ----- | ------ |
| apoyo_ud@fesc.edu.co | Diego Alexander Rincon Casarubia |
| ericksperezc@gmail.com | Erick Sebastian Perez Carvajal |
| tecnico_ud@fesc.edu.co | Erick Sebastian Perez Carvajal |

Password: valor de `SEED_ADMIN_PASSWORD`.

### Donantes (`USER`)

8 usuarios con perfil (telefono, ciudad, departamento, bio). Emails en `DONOR_USERS` de `seed-data.ts`.

Password: `SEED_DEMO_PASSWORD` o `AyudaDemo2026!`.

### Fundaciones

| Nombre | Estado | Cuenta |
| ------ | ------ | ------ |
| UNICEF Colombia | VERIFIED | contacto.colombia@unicef-demo.org |
| Cruz Roja Colombiana — Seccional Bogota | VERIFIED | donaciones@cruzroja-demo.org |
| Banco de Alimentos de Bogota | VERIFIED | aporte@bancoalimentos-demo.org |
| TECHO Colombia | VERIFIED | voluntarios@techo-demo.org |
| Fundacion Exito | VERIFIED | fundacion.exito@demo.org |
| Asociacion Manos que Suman | PENDING | nueva.fundacion@pendiente.org |

Cada fundacion verificada incluye documentos placeholder, redes sociales, campanas, needs y logos (`logoUrl` via Unsplash).

Password de cuentas `FOUNDATION`: misma que donantes demo.

### Donaciones demo

Hasta 12 donaciones de muestra con historial de estado, asociadas a donantes y needs del seed.

## Imagenes

Los `logoUrl` de fundaciones y `imageUrl` de campanas usan URLs publicas de Unsplash (`images.unsplash.com`).

No usar thumbnails de Wikimedia con tamanos arbitrarios: suelen responder HTTP 400.

## Comandos

```bash
# Local (requiere DATABASE_URL y SEED_ADMIN_PASSWORD en .env)
npm run prisma:seed

# Migraciones + seed
npm run db:setup
```

## Relacionado

- Deploy: [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)
- Esquema: [DATABASE.md](./DATABASE.md)
- Credenciales resumidas: [README.md](../README.md)
