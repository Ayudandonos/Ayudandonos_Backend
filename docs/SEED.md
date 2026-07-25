# Seed de datos — Backend

Archivos: `prisma/seed.ts` (logica) y `prisma/seed-data.ts` (dataset).

## Comportamiento

Cada ejecucion de `prisma db seed`:

1. **Vacia** todas las tablas de negocio con `TRUNCATE ... CASCADE`.
2. **Crea** unicamente el dataset definido en `seed-data.ts`.

No es idempotente por upsert: siempre deja la BD exactamente igual al seed.

### Tablas truncadas

`notifications`, `messages`, `conversations`, `donation_status_history`, `donations`, `needs`, `post_comments`, `post_reactions`, `foundation_post_images`, `foundation_post_lines`, `foundation_posts`, `stock_movements`, `inventory_outbound_lines`, `inventory_outbounds`, `inventory_items`, `campaigns`, `foundation_branches`, `foundation_admin_observations`, `foundation_documents`, `foundation_social_links`, `foundations`, `users`.

### Cuando se ejecuta

| Contexto | Comando / momento |
| -------- | ----------------- |
| Local | `npm run prisma:seed` (aplica migraciones y luego seed) o `npm run db:setup` |
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

18 usuarios con perfil: 8 principales + 10 historicos adicionales. Emails en `DONOR_USERS` y `HISTORICAL_DONOR_USERS` de `seed-data.ts`.

Las fechas de registro, altas de fundaciones/campanas y donaciones se distribuyen en **~6 meses** para alimentar graficas del panel admin.

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

Cada fundacion verificada incluye documentos placeholder, redes sociales, **3 sedes** (una marcada como principal), campanas, needs y logos (`logoUrl` via Unsplash).

Password de cuentas `FOUNDATION`: misma que donantes demo.

### Donaciones demo

Aproximadamente **40 donaciones** distribuidas en los ultimos 6 meses, con estados `COMMITTED`, `RECEIVED` y `CANCELLED` segun antiguedad.

### Mensajeria demo

Tras crear las donaciones, el seed agrega **mensajes de donantes** (y algunas respuestas de fundacion) en hasta 18 conversaciones activas:

- Hilos de 1 a 4 mensajes en espanol.
- Preview en bandeja (`lastMessageAt`, `lastMessageBody`, `unreadCount`).
- Conversacion destacada de **Maria Camila Gomez** (`maria.gomez.donante@gmail.com`) con hilo completo y mensajes sin leer para la fundacion.

El log del seed imprime el UUID de la donacion destacada para pruebas en `/foundation/messages/:donationId`.

### Inventario y publicaciones de impacto

Tras crear las donaciones, el seed genera inventario **coherente con donaciones recibidas** (`RECEIVED`):

1. **Entradas (IN):** una por cada donacion recibida, con producto alineado al nombre y unidad de la necesidad (`need`).
2. **Salidas (OUT):** hasta 2 por fundacion verificada, con stock descontado y campana asociada a donaciones reales.
3. **Publicaciones:** cada salida crea un `foundation_post` obligatorio con minimo 3 imagenes Unsplash, lineas de producto y slug publico.
4. **Actividad social demo:** reacciones y comentarios de donantes en las publicaciones creadas.

Ejemplo de log: `Inventario: 28 entradas desde donaciones recibidas; 9 salidas con publicacion.`

## Imagenes

Los `logoUrl` de fundaciones, `imageUrl` de campanas y fotos de publicaciones de impacto usan URLs publicas de Unsplash (`images.unsplash.com`).

No usar thumbnails de Wikimedia con tamanos arbitrarios: suelen responder HTTP 400.

## Comandos

```bash
# Local (requiere DATABASE_URL y SEED_ADMIN_PASSWORD en .env)
npm run prisma:seed

# Migraciones + seed
npm run db:setup
```

## Errores frecuentes

### `The column foundation_branch_id does not exist` (P2022)

El cliente Prisma esta al dia con el schema, pero la base de datos local no tiene las migraciones aplicadas.

```bash
npm run db:deploy
npm run prisma:seed
```

O en un solo paso: `npm run db:setup`.

## Relacionado

- Deploy: [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)
- Esquema: [DATABASE.md](./DATABASE.md)
- Credenciales resumidas: [README.md](../README.md)
