# Despliegue en Vercel — Backend

## URL del proyecto

- **Produccion (usar en frontend):** `https://ayudandonos-backend.vercel.app`
- Preview: `https://ayudandonos-backend-*.vercel.app` (puede tener Deployment Protection)

**Health check:** `GET /api/v1/health`

**Swagger:** `GET /api/v1/docs`

---

## Problema: CORS — Redirect is not allowed for a preflight request

Si el navegador muestra este error al llamar la API desde el frontend:

```
Access to XMLHttpRequest ... has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
Redirect is not allowed for a preflight request.
```

### Causas habituales

1. **URL incorrecta del backend en el frontend.** No usar URLs con sufijo de equipo (`*-erick-s-projects8.vercel.app`); esas suelen tener **Deployment Protection** y redirigen (302) al login de Vercel antes de llegar a Express.
2. **`CORS_ORIGIN` sin el dominio exacto del frontend.** Debe coincidir con el `Origin` del navegador (protocolo + host, sin slash final).

### Solucion

**En el frontend** (`.env` de produccion):

```
VITE_API_URL=https://ayudandonos-backend.vercel.app/api/v1
```

**En Vercel (backend)** — variable `CORS_ORIGIN`:

```
https://ayudandonos-frontend.vercel.app,https://ayudandonos-frontend-erick-s-projects8.vercel.app,http://localhost:5173
```

Configurar en **Production**, **Preview** y **Development**.

---

## Problema: la URL muestra login de Vercel

Si al abrir la URL ves **"Log in to Vercel"**, no es un error de la API. Es **Deployment Protection** activada.

### Solucion

1. [Vercel Dashboard](https://vercel.com) → proyecto `ayudandonos-backend`
2. **Settings** → **Deployment Protection**
3. Para pruebas de API: desactivar proteccion en **Preview** o usar solo el dominio de **Production** sin proteccion
4. Alternativa: autenticarte en Vercel y usar el enlace desde el dashboard

---

## Variables de entorno (obligatorias en Vercel)

Configurar en **Settings → Environment Variables**:

| Variable | Ejemplo | Notas |
| -------- | ------- | ----- |
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `postgresql://...` | Neon, Supabase o Railway (no localhost) |
| `JWT_SECRET` | clave larga aleatoria | min 10 caracteres |
| `JWT_EXPIRES_IN` | `7d` | |
| `CORS_ORIGIN` | `https://tu-frontend.vercel.app` | Varias URLs separadas por coma |
| `RATE_LIMIT_WINDOW_MS` | `900000` | |
| `RATE_LIMIT_MAX` | `100` | |

Opcional (Vercel la inyecta automaticamente):

| Variable | Uso |
| -------- | --- |
| `VERCEL_URL` | Swagger y URL del servidor |

**No configurar** `SEED_ADMIN_PASSWORD` en produccion salvo despliegue inicial controlado.

### Base de datos recomendada

- [Neon](https://neon.tech) (PostgreSQL serverless, gratis)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

Tras crear la BD, pegar `DATABASE_URL` en Vercel. Para Neon en serverless, usar connection string con **pooling** si esta disponible.

---

## Configuracion del repositorio

El proyecto incluye:

| Archivo | Funcion |
| ------- | ------- |
| `vercel.json` | Rewrite todas las rutas a `/api` |
| `api/index.js` | Entry serverless (Express) |
| `src/vercel.ts` | App Express + conexion lazy a BD |
| `npm run vercel-build` | `prisma generate` + `migrate deploy` + `tsc` |

### Build en Vercel

- **Root Directory:** `.` (raiz del repo backend)
- **Build Command:** `npm run vercel-build` (definido en `vercel.json`)
- **Install Command:** `npm install`
- **Output Directory:** vacio (serverless)

---

## Primer despliegue

1. Conectar repo `Ayudandonos_Backend` en Vercel
2. Agregar variables de entorno
3. Desplegar
4. Verificar: `GET https://tu-url.vercel.app/api/v1/health`
5. (Opcional) Ejecutar seed una vez con BD de produccion desde local apuntando a `DATABASE_URL` de prod

---

## Desarrollo local vs Vercel

| Entorno | Comando | Entry |
| ------- | ------- | ----- |
| Local | `npm run dev` | `src/server.ts` (puerto 3000) |
| Vercel | automatico | `api/index.js` → `dist/vercel.js` |

---

## CORS con frontend

**Backend (Vercel → Environment Variables):**

```
CORS_ORIGIN=https://ayudandonos-frontend.vercel.app,https://ayudandonos-frontend-erick-s-projects8.vercel.app,http://localhost:5173
```

**Frontend (`.env.production`):**

```
VITE_API_URL=https://ayudandonos-backend.vercel.app/api/v1
```

No usar `https://ayudandonos-backend-erick-s-projects8.vercel.app` en el frontend: esa URL puede redirigir y romper CORS.
