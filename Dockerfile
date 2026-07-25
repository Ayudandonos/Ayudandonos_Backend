# syntax=docker/dockerfile:1

# --- Build ---
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npx tsc

# Conserva prisma CLI + tsx (seed) y elimina el resto de devDependencies
RUN npm prune --omit=dev && npm install tsx@4.19.3 --no-save

# --- Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache libc6-compat openssl \
  && addgroup -S app && adduser -S app -G app \
  && mkdir -p /app/uploads \
  && chown -R app:app /app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/package-lock.json ./package-lock.json
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
