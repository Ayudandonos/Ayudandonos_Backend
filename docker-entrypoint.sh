#!/bin/sh
set -e

echo "[docker-entrypoint] Aplicando migraciones (prisma migrate deploy)..."
npx prisma migrate deploy

if [ "${RUN_SEED_ON_START}" = "true" ]; then
  echo "[docker-entrypoint] RUN_SEED_ON_START=true — ejecutando seed (TRUNCATE + dataset demo)..."
  npx prisma db seed
else
  echo "[docker-entrypoint] Seed omitido (RUN_SEED_ON_START no es true)."
fi

echo "[docker-entrypoint] Iniciando API..."
exec node dist/server.js
