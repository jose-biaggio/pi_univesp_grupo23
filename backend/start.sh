#!/bin/sh
set -e

echo "==> Verificando configuração de conexão com o banco de dados..."
python3 -c "
import os

raw_url = (os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL') or '').strip()
if raw_url:
    if raw_url.startswith('\${{'):
        print('==> AVISO: A variável de URL do banco contém uma sintaxe de template não resolvida:', raw_url)
    elif '://' in raw_url:
        masked = raw_url.split('://')[0] + '://' + (raw_url.split('@')[-1] if '@' in raw_url else '...')
        print('==> URL de banco detectada:', masked)
    else:
        print('==> Formato de URL desconhecido:', raw_url)
else:
    host = os.getenv('DB_HOST') or os.getenv('MYSQLHOST') or 'db (padrão local)'
    db = os.getenv('DB_NAME') or os.getenv('MYSQLDATABASE') or 'manutencao_sync'
    print(f'==> Usando variáveis individuais: host={host}, database={db}')
"

echo "==> Executando migrações do banco de dados (Alembic)..."
alembic upgrade head

echo "==> Inicializando usuário administrador (seed)..."
python -m app.seed || true

PORT="${PORT:-8000}"
echo "==> Iniciando Uvicorn na porta ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"

