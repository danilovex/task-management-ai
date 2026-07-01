# 📋 Task Management AI

> **Projeto acadêmico** — Sistema de gestão de tarefas (Kanban) com integração de Agentes de IA, MCP e n8n.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## 🎯 Objetivo do Projeto

Construir um sistema simples de **gestão de tarefas no formato Kanban**, onde o foco principal é explorar a integração de tecnologias modernas de Inteligência Artificial:

| Fase       | Tecnologia                      | Descrição                                                        |
| ---------- | ------------------------------- | ---------------------------------------------------------------- |
| **Fase 1** | 🤖 Agentes de IA                | Implementar agentes inteligentes que interagem com as tarefas    |
| **Fase 2** | 🔌 MCP (Model Context Protocol) | Expor as tarefas via MCP para consumo por modelos de IA          |
| **Fase 3** | ⚡ n8n                          | Criar fluxos de automação que interagem com os dados das tarefas |

---

## 🏗️ Arquitetura do Projeto

O projeto é estruturado como um **Monorepo** utilizando **npm Workspaces**, unificando frontend e backend com TypeScript e ferramentas compartilhadas de qualidade de código.

```
task-management-ai/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express + TypeScript
├── eslint.config.mjs  # Configuração centralizada do ESLint
├── .prettierrc        # Configuração centralizada do Prettier
├── .prettierignore    # Arquivos ignorados pelo Prettier
├── .gitignore         # Arquivos ignorados pelo Git
├── package.json       # Raiz do Monorepo (workspaces + scripts globais)
└── LICENSE            # Licença MIT
```

### Quadro Kanban

O sistema possui um quadro Kanban com **5 colunas**:

| Coluna           | Descrição                        |
| ---------------- | -------------------------------- |
| **Backlog**      | Tarefas ainda não planejadas     |
| **To Do**        | Tarefas planejadas para execução |
| **Doing**        | Tarefas em andamento             |
| **Verification** | Tarefas em verificação/revisão   |
| **Done**         | Tarefas concluídas               |

### Modelo da Tarefa

Cada tarefa possui os seguintes campos:

| Campo           | Tipo         | Descrição                                 |
| --------------- | ------------ | ----------------------------------------- |
| `nome`          | string       | Nome da tarefa                            |
| `tags`          | string[]     | Tags para categorização                   |
| `responsavel`   | string       | Pessoa responsável                        |
| `dataInicio`    | Date         | Data de início                            |
| `dataFim`       | Date         | Data prevista de término                  |
| `dataConclusao` | Date \| null | Data real de conclusão                    |
| `status`        | enum         | Backlog, To Do, Doing, Verification, Done |

### Funcionalidades do Kanban

- ✅ Visualizar tarefas organizadas por coluna
- ✅ Mover tarefas entre colunas (drag & drop)
- ✅ Cadastrar novas tarefas
- ✅ Editar tarefas existentes
- ✅ Excluir tarefas
- ✅ Banco de dados em memória com seed automático ao iniciar o projeto

### Stack Tecnológica

| Camada             | Tecnologia                            |
| ------------------ | ------------------------------------- |
| **Frontend**       | React 19 + Vite + TypeScript          |
| **Backend**        | Node.js + Express 5 + TypeScript      |
| **Banco de Dados** | Em memória (seed automático no start) |
| **Linter**         | ESLint 9 (Flat Config)                |
| **Formatter**      | Prettier                              |
| **Monorepo**       | npm Workspaces                        |

---

## 🛠️ Guia de Criação do Projeto (Passo a Passo)

> Este guia descreve todos os passos utilizados para criar este repositório do zero. Ideal para alunos que querem reproduzir a estrutura.

### 1. Inicialização da Raiz do Monorepo

Criamos a pasta principal e inicializamos o workspace do npm para gerenciar os subprojetos.

```bash
# Criar e entrar na pasta raiz
mkdir task-management-ai
cd task-management-ai

# Inicializar o pacote npm
npm init -y

# Inicializar o repositório Git
git init
```

No arquivo `package.json` da raiz, configuramos os workspaces apontando para as pastas `frontend/` e `backend/` diretamente na raiz:

```json
{
  "name": "task-management-ai",
  "private": true,
  "type": "commonjs",
  "workspaces": ["frontend", "backend"]
}
```

> **Nota:** O `"type": "commonjs"` na raiz é intencional. Cada subprojeto define seu próprio `"type"` conforme necessário (o frontend usa `"module"` e o backend também usa `"module"`).

---

### 2. Criação do Frontend (React + Vite + TypeScript)

Geramos a estrutura do frontend utilizando o assistente do Vite na raiz do monorepo.

```bash
# Gerar o template do React com TypeScript (cria a pasta frontend/)
npm create vite@latest frontend -- --template react-ts

# Instalar as dependências do frontend
cd frontend
npm install

# Instalar MUI v6 e biblioteca de drag & drop
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @hello-pangea/dnd

cd ..
```

O Vite já configura o `package.json` do frontend com `"type": "module"` automaticamente.

---

### 3. Criação do Backend (Node.js + Express + TypeScript)

Configuramos o servidor backend de forma isolada.

```bash
# Criar e inicializar a pasta do backend
mkdir backend
cd backend
npm init -y

# Instalar as dependências do Express, Prisma Client e driver do SQLite
npm install express cors dotenv @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3

# Instalar dependências de desenvolvimento (Compilador TS, CLI do Prisma, executores e tipagens)
npm install --save-dev typescript @types/node @types/express @types/cors ts-node tsx prisma @types/better-sqlite3

# Inicializar o arquivo de configuração do TypeScript (tsconfig.json)
npx tsc --init

# Inicializar o Prisma para SQLite
npx prisma init --datasource-provider sqlite
```

No `package.json` do backend, configuramos como **ES Module** e adicionamos os scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc"
  }
}
```

> **Importante:** O `"type": "module"` é necessário porque o `tsconfig.json` do backend utiliza `"module": "nodenext"` com `"verbatimModuleSyntax": true`. Essa combinação exige que o pacote seja tratado como ESM.

Criamos o arquivo de entrada `backend/src/index.ts` com o servidor Express básico.

Adicionalmente, para a **Fase 0 (SQLite e Prisma)**:

1. Configuramos o arquivo `backend/.env` para salvar o banco em `file:./prisma/dev.db`.
2. Registramos o script de seed no arquivo `backend/prisma.config.ts`:
   ```typescript
   migrations: {
     path: "prisma/migrations",
     seed: "npx tsx prisma/seed.ts",
   }
   ```
3. Executamos o push inicial, geramos o cliente do Prisma e rodamos o seed:
   ```bash
   npx prisma db push
   npx prisma generate
   npx prisma db seed
   ```

---

### 4. Configuração do ESLint e Prettier (Qualidade de Código)

Para garantir que ambos os projetos sigam o mesmo padrão de formatação e regras de código, as ferramentas foram instaladas na **raiz do repositório**.

```bash
# Na raiz do monorepo
npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks
```

Foram criados os seguintes arquivos de configuração na raiz:

| Arquivo             | Descrição                                                                            |
| ------------------- | ------------------------------------------------------------------------------------ |
| `eslint.config.mjs` | Configuração do ESLint (Flat Config) para TypeScript e React, integrado com Prettier |
| `.prettierrc`       | Regras de formatação (aspas simples, ponto e vírgula, trailing comma, etc.)          |
| `.prettierignore`   | Pastas/arquivos ignorados pelo Prettier (`node_modules`, `dist`, `.vite`)            |

> **Nota:** O arquivo de configuração do ESLint usa a extensão `.mjs` (ao invés de `.js`) para forçar o Node.js a carregá-lo como ES Module, independente do `"type"` configurado no `package.json` raiz.

---

### 5. Orquestração e Scripts Globais

Para facilitar o desenvolvimento sem a necessidade de abrir múltiplos terminais, instalamos a biblioteca `concurrently` na raiz:

```bash
npm install concurrently --save-dev
```

No `package.json` da **raiz**, configuramos os scripts globais:

```json
"scripts": {
  "dev:frontend": "npm run dev -w frontend",
  "dev:backend": "npm run dev -w backend",
  "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write ."
}
```

---

## 🚀 Como Executar o Projeto

Se você acabou de clonar este repositório, basta seguir os passos abaixo:

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior

### Instalação e Execução

```bash
# 1. Clonar o repositório
git clone https://github.com/danilovex/task-management-ai.git
cd task-management-ai

# 2. Instalar todas as dependências (raiz + subprojetos)
npm install

# 3. Gerar tabelas e semear dados iniciais de 2026 no SQLite
cd backend
npx prisma db push
npx prisma generate
npx prisma db seed
cd ..

# 4. Rodar o projeto em modo de desenvolvimento
npm run dev
```

| Serviço                     | URL                   |
| --------------------------- | --------------------- |
| **Frontend** (React + Vite) | http://localhost:5173 |
| **Backend** (Express API)   | http://localhost:3001 |

### Scripts Disponíveis

| Comando                | Descrição                                 |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Inicia frontend e backend simultaneamente |
| `npm run dev:frontend` | Inicia apenas o frontend                  |
| `npm run dev:backend`  | Inicia apenas o backend                   |
| `npm run lint`         | Verifica erros de código com ESLint       |
| `npm run lint:fix`     | Corrige erros de código automaticamente   |
| `npm run format`       | Formata todo o código com Prettier        |

---

## 🤖 Fase 1 — Integração do Agente de IA (LangChain + OpenAI)

Implementamos um agente de inteligência artificial interativo para responder e operar o quadro Kanban via chat na interface.

### 1. Pacotes Instalados no Backend

Instalamos o suporte básico de IA do ecossistema LangChain na pasta `backend/`:

```bash
cd backend
npm install @langchain/openai @langchain/core zod
```

### 2. Racional e Arquitetura do Agente (`backend/src/services/ai.ts`)

- **Execução Customizada:** Em vez de utilizar o executor legado (`AgentExecutor` de `langchain/agents` que possui problemas de importação sob as regras estritas de ESM/`nodenext`), desenvolvemos um loop de controle moderno de **Tool Calling** utilizando diretamente as mensagens estruturadas do `@langchain/core` e binding do `@langchain/openai`.
- **Ferramentas Registradas (Tools):**
  - `get_tasks_summary`: Consulta as tarefas por mês/responsável e devolve estatísticas detalhadas.
  - `get_tasks_by_responsible`: Busca tarefas vinculadas a pessoas por trecho de nome.
  - `get_tasks_by_tag`: Busca tarefas associadas a tags específicas.
  - `get_overdue_tasks`: Filtra tarefas com prazo ultrapassado que não foram finalizadas.
  - `create_task`: Cria tarefas vinculando responsável e períodos em formato ISO.
  - `update_task_status`: Move tarefas entre colunas (ex: backlog para doing).
- **Contexto Temporal Dinâmico:** Injetamos a data atual da máquina no Prompt do Sistema para que o modelo entenda semanticamente referências relativas como _"hoje"_, _"este mês"_ ou _"este ano"_ e monte filtros corretos no banco.
- **Restrição de Escopo:** O agente está programado para responder apenas sobre o escopo de tarefas e Kanban. Perguntas aleatórias (receitas, piadas, programação) são polidamente recusadas.

### 3. Interface Visual do Chat (`frontend/`)

- **Botão Flutuante (FAB):** Um botão redondo flutuante com ícone de robô (`SmartToyIcon`) posicionado no canto inferior direito.
- **Gaveta Lateral (`AIChatDrawer`):** Um componente sliding drawer que abriga o histórico da conversa, balões estilizados separados por cores para usuário/assistente e animação de carregamento ("Pensando...").
- **Sincronização em Tempo Real:** O chat implementa um callback (`onTaskMutated`) que recarrega o quadro Kanban imediatamente após o agente confirmar a criação ou a movimentação de uma tarefa pelo chat.

---

## 🔌 Fase 2 — MCP Server (Model Context Protocol)

Expomos as ferramentas de gerenciamento de tarefas como um **MCP Server** standalone, permitindo que qualquer cliente compatível (Claude Desktop, Cursor, IDEs) consuma as operações do Kanban de forma padronizada.

### 1. Pacotes Instalados no Backend

```bash
cd backend
npm install @modelcontextprotocol/sdk
```

### 2. Refatoração — Camada Compartilhada de Handlers

Para evitar duplicação de código entre o agente LangChain e o MCP Server, extraímos toda a lógica de acesso a dados (queries Prisma) para funções TypeScript puras reutilizáveis:

```
backend/src/
├── tools/
│   ├── handlers.ts   # Lógica de negócio pura (Prisma queries)
│   └── index.ts      # Barrel file de re-exportação
├── services/
│   └── ai.ts         # Agente LangChain (agora usa handlers)
└── mcp-server.ts     # MCP Server standalone (também usa handlers)
```

- **`handlers.ts`**: 6 funções assíncronas puras (`getTasksSummary`, `getTasksByResponsible`, `getTasksByTag`, `getOverdueTasks`, `createTask`, `updateTaskStatus`) que recebem parâmetros tipados e retornam strings.
- **`ai.ts`**: Refatorado para ser uma casca fina — cada `tool()` do LangChain agora apenas delega para o handler correspondente.
- **`mcp-server.ts`**: Registra as mesmas 6 tools via `server.tool()` do SDK do MCP, reutilizando os mesmos handlers.

### 3. Arquitetura do MCP Server

- **Transporte:** Stdio (padrão para ferramentas locais). O servidor é spawnado pelo cliente MCP como um subprocesso.
- **Porta:** Nenhuma porta HTTP adicional é necessária — o servidor Express existente (porta 3001) **não foi alterado**.
- **Classe:** `McpServer` de `@modelcontextprotocol/sdk/server/mcp.js` (API de alto nível recomendada).

### 4. Tools Expostas via MCP

| Tool                       | Tipo    | Descrição                         |
| -------------------------- | ------- | --------------------------------- |
| `get_tasks_summary`        | Leitura | Resumo quantitativo por status    |
| `get_tasks_by_responsible` | Leitura | Tarefas filtradas por responsável |
| `get_tasks_by_tag`         | Leitura | Tarefas filtradas por tag         |
| `get_overdue_tasks`        | Leitura | Tarefas com prazo ultrapassado    |
| `create_task`              | Escrita | Criar nova tarefa no quadro       |
| `update_task_status`       | Escrita | Mover tarefa entre colunas        |

### 5. Como Executar o MCP Server

```bash
# Iniciar o servidor MCP (modo standalone via stdio)
cd backend
npm run mcp
```

### 6. Como Configurar em Clientes MCP (Claude Desktop / Cursor)

Adicione ao arquivo de configuração do seu cliente MCP (ex: `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "task-management-kanban": {
      "command": "npx",
      "args": ["tsx", "src/mcp-server.ts"],
      "cwd": "/CAMINHO/ABSOLUTO/PARA/task-management-ai/backend",
      "env": {
        "DATABASE_URL": "file:./prisma/dev.db"
      }
    }
  }
}
```

> Um exemplo pronto está disponível em `mcp-config-example.json` na raiz do repositório.

---

## 📚 Roadmap do Projeto

- [x] **Fase 0** — Implementar o Kanban funcional (CRUD de tarefas + drag & drop)
- [x] **Fase 1** — Integrar Agentes de IA para interação inteligente com as tarefas
- [x] **Fase 2** — Expor dados via MCP (Model Context Protocol) para consumo por modelos de IA
- [ ] **Fase 3** — Criar fluxos de automação com n8n

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](./LICENSE).
