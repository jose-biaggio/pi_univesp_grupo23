# Manutenção Sync - Plataforma de Sincronização e Monitoramento de Manutenção

## Sobre o Projeto

O **Manutenção Sync** é uma plataforma web voltada para o registro, controle e monitoramento de atividades de manutenção. O objetivo principal é solucionar dificuldades de integração e compartilhamento de dados entre diferentes sistemas, proporcionando confiabilidade nas informações e auxílio na tomada de decisões gerenciais.

-----

## Tecnologias Utilizadas

  - **Frontend:** HTML, CSS, JavaScript e Bootstrap
  - **Backend:** Python e FastAPI (API REST em JSON)
  - **Banco de Dados:** MariaDB (integração via SQLAlchemy e PyMySQL)
  - **Análise de Dados:** Google Looker Studio
  - **Versionamento:** Git e GitHub
  - **Hospedagem / Deploy:** Railway

-----

## Arquitetura do Sistema

A solução é dividida em camadas funcionais:

1.  **Frontend (Interface Web):** Interface responsiva e intuitiva para consulta de ordens programadas e registro de apontamentos.
2.  **Backend (API REST):** Desenvolvido em FastAPI, responsável pelo processamento de regras de negócio, validações e ponte de comunicação com o banco de dados.
3.  **Banco de Dados:** Instância MariaDB responsável por armazenar registros de programação, ordens, operações e apontamentos.
4.  **Dashboards & Relatórios:** Integração com o Google Looker Studio para exibição de indicadores de desempenho e relatórios gerenciais.

-----

## Módulos e Funcionalidades principais

  - **Autenticação:** Tela de login para controle de acesso seguro dos usuários.
  - **Programação de Manutenção:** Consulta e acompanhamento do status de ordens e operações programadas.
  - **Registro de Apontamentos:** Lançamento das horas trabalhadas nas atividades de manutenção e histórico de registros.
  - **Dashboards de Indicadores:** Monitoramento de metas e resultados como aderência ao planejamento, backlog e horas por tipo de manutenção.
