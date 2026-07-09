# Despliegue en Vercel — Backend

## URL del proyecto

- Produccion: configurar dominio en Vercel Dashboard
- Preview: `https://ayudandonos-backend-*.vercel.app`

**Health check:** `GET /api/v1/health`

**Swagger:** `GET /api/v1/docs`

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

Si el frontend esta en Vercel, ejemplo:

```
CORS_ORIGIN=https://ayudandonos-frontend.vercel.app,http://localhost:5173
```

En el frontend, `.env`:

```
VITE_API_URL=https://tu-backend.vercel.app/api/v1
```
