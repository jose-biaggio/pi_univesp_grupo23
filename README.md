# Manutenção Sync - Plataforma de Sincronização e Monitoramento de Manutenção

## Sobre o Projeto

O **Manutenção Sync** é uma plataforma web voltada para o registro, controle e monitoramento de atividades de manutenção. O objetivo principal é solucionar dificuldades de integração e compartilhamento de dados entre diferentes sistemas, proporcionando confiabilidade nas informações e auxílio na tomada de decisões gerenciais.

---

## Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla e Bootstrap 5
- **Backend:** Python 3.11+ e FastAPI (API REST em JSON)
- **Banco de Dados:** MariaDB 10.11 LTS (integração via SQLAlchemy e PyMySQL)
- **Migrações de Banco:** Alembic
- **Proxy Reverso & Gateway:** Nginx
- **Orquestração Local:** Docker e Docker Compose
- **Análise de Dados:** Google Looker Studio
- **Versionamento:** Git e GitHub
- **Hospedagem / Deploy:** Railway

---

## Como Executar o Projeto Localmente

### Pré-requisitos
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/jose-biaggio/pi_univesp_grupo23.git
cd pi_univesp_grupo23
```

### 2. Configurar o Ambiente (.env)
Copie o arquivo de exemplo para criar o seu `.env`:
```bash
cp .env.example .env
```

### 3. Iniciar a Aplicação com Docker
Para construir as imagens e subir os contêineres em segundo plano:
```bash
docker-compose up -d --build
```

### 4. Verificar o Status dos Contêineres
```bash
docker-compose ps
```

### 5. Encerrar os Contêineres
Para parar os serviços:
```bash
docker-compose down
```

---

## URLs de Acesso

Com os contêineres rodando, acesse no navegador:

- **Frontend (Aplicação Web):** [http://localhost](http://localhost) (redireciona para o login)
- **Documentação Interativa da API (Swagger UI):** [http://localhost/docs](http://localhost/docs)
- **Verificação de Saúde (Health Check):** [http://localhost/api/health](http://localhost/api/health)

---

## Comandos do Banco de Dados e Migrações (Alembic)

O `alembic upgrade head` já é executado **automaticamente** na inicialização do contêiner `backend`. Caso queira gerenciar as migrações manualmente via terminal:

- **Aplicar migrações pendentes:**
  ```bash
  docker-compose exec backend alembic upgrade head
  ```
- **Gerar nova migração após alterar models no SQLAlchemy:**
  ```bash
  docker-compose exec backend alembic revision --autogenerate -m "descricao_da_alteracao"
  ```
- **Verificar a versão atual aplicada no banco:**
  ```bash
  docker-compose exec backend alembic current
  ```
- **Desfazer a última migração (Rollback):**
  ```bash
  docker-compose exec backend alembic downgrade -1
  ```
- **Acessar o terminal interativo do MariaDB:**
  ```bash
  docker-compose exec db mariadb -u sync_user -psync_password manutencao_sync
  ```

---

## Carga Inicial de Dados (Seed)

Para popular a base de dados com o usuário administrador padrão:

```bash
docker-compose exec backend python -m app.seed
```

> **Credenciais de Acesso Inicial:**
> - **Usuário:** `admin`
> - **Senha:** `admin123`
> - **Perfil:** `ADMIN`

O script é **idempotente** (se o usuário já existir, a operação não duplicará o registro).

### Testar a Autenticação via cURL:

1. **Realizar Login e Obter o Token JWT:**
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "senha": "admin123"}'
```
*Retorno:*
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "mensagem": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "nome": "Administrador do Sistema",
    "usuario": "admin",
    "email": "admin@manutencaosync.com.br",
    "perfil": "ADMIN",
    "ativo": true
  }
}
```

2. **Acessar Rota Protegida com o Bearer Token:**
```bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"usuario": "admin", "senha": "admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -X GET http://localhost/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

