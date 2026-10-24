#!/bin/sh
set -e

echo "==> Executando migrações do banco de dados (Alembic)..."
alembic upgrade head

echo "==> Inicializando usuário administrador (seed)..."
python -m app.seed || true

PORT="${PORT:-8000}"
echo "==> Iniciando Uvicorn na porta ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"

