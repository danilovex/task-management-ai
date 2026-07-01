# Project Plan — Phase 1: AI Agent Chat Integration

Plan to implement an AI Agent utilizing LangChain and OpenAI, exposed via a floating button and drawer in the Kanban UI. The agent will use Tool Calling to query and modify tasks stored in SQLite via Prisma.

---

## Overview

We will integrate a conversational AI assistant directly into the task management monorepo.

- **Frontend:** A Floating Action Button (FAB) will toggle a sliding Drawer containing a clean chat interface.
- **Backend:** A new `/api/chat` endpoint will process chat histories using LangChain's Agent architecture, powered by OpenAI.
- **AI capability:** The agent will dynamically call backend tools (queries/mutations) to answer questions, compile statistics, create tasks, and update columns.
  The ai chat is restrict subject about tasks of kanban, if user ask about another subject, the ai chat dont have aswer

---

## Project Type

**WEB** (Frontend React + MUI) + **BACKEND** (Express API + SQLite)

---

## Tech Stack

- **AI SDK:** LangChain (`@langchain/openai`, `@langchain/core`)
- **LLM Provider:** OpenAI (`gpt-4o-mini` or similar cost-efficient model)
- **Frontend UI:** Material UI (`Drawer`, `TextField`, `List`, `ListItem`, `Avatar`, `Fab`)
- **Backend Service:** Express + Prisma Client

---

## Proposed Tools Design (LangChain Tools)

To support the agent's capabilities, we will implement the following structured tools:

1. **`get_tasks_summary`**
   - _Description:_ Retrieves counts of tasks, grouped by status (backlog, todo, doing, verification, done), optionally filtered by a specific month (0-11) or responsible user.
   - _Arguments:_ `{ month?: number, responsavelId?: number }`
2. **`get_tasks_by_responsible`**
   - _Description:_ Searches for tasks assigned to a specific person by name.
   - _Arguments:_ `{ nome: string }`
3. **`get_tasks_by_tag`**
   - _Description:_ Retrieves all tasks associated with a specific tag name.
   - _Arguments:_ `{ tagNome: string }`
4. **`get_overdue_tasks`**
   - _Description:_ Finds all tasks that have exceeded their `dataFim` and are not marked as `done`.
   - _Arguments:_ `{}`
5. **`create_task`**
   - _Description:_ Creates a new task in the database.
   - _Arguments:_ `{ nome: string, status: string, responsavelId: number, dataInicio: string, dataFim: string, tags?: number[] }`
6. **`update_task_status`**
   - _Description:_ Updates the status (column) of an existing task.
   - _Arguments:_ `{ taskId: string, status: string }`

---

## Proposed File Structure

```
task-management-ai/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── ai.ts          # [NEW] LangChain agent and tools configuration
│   │   │   └── index.ts       # [MODIFY] Register AI chat router
```

```
task-management-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── AIChatDrawer.tsx  # [NEW] Sliding drawer component for chat
│   │   │   └── App.tsx           # [MODIFY] Render FAB and AIChatDrawer
```

---

## Task Breakdown

### Phase 1: Backend Setup & LangChain Agent

- **Task 1.1: Install Dependencies**
  - Install `@langchain/openai`, `@langchain/core`, and `zod` in `backend/`.
  - _Verify:_ `npm run build` compiles with the new dependencies.
- **Task 1.2: Implement Agent Tools**
  - Define the LangChain tools (`get_tasks_summary`, `get_tasks_by_responsible`, `get_tasks_by_tag`, `get_overdue_tasks`, `create_task`, `update_task_status`) using Zod schemas for input validation.
  - _Verify:_ Unit tests or mock calls demonstrate tools correctly query/mutate SQLite.
- **Task 1.3: Configure OpenAI Agent Executor**
  - Create the agent executor template using LangChain's `createOpenAIToolsAgent`. Set system instructions defining the agent's persona (helpful Kanban assistant) and database scope.
  - _Verify:_ The agent service returns responses when fed a test chat history.
- **Task 1.4: Add Chat Endpoint**
  - Expose `POST /api/chat` accepting `{ messages: { role: string, content: string }[] }`. Process the conversation history and stream or return the text output.
  - _Verify:_ Fetching `POST /api/chat` with "Quantas tarefas temos?" returns a structured response using tools.

### Phase 2: Frontend Chat UI

- **Task 2.1: Implement AIChatDrawer Component**
  - Create a sidebar drawer featuring a message history list, loading indicators while the agent is typing, and an input text field.
  - _Verify:_ The drawer opens/closes correctly and message history scrolls properly.
- **Task 2.2: Integrate Toggle FAB**
  - Add a dedicated FAB (Floating Action Button) with a chat icon in the bottom-right corner of the Kanban board to trigger the drawer.
  - _Verify:_ Clicking the FAB toggles the drawer.
- **Task 2.3: Connect Chat API**
  - Send queries to `POST /api/chat` on submit and display the assistant's responses. Hook into state changes: if the agent creates or updates a task status, trigger a reload of the Kanban board tasks so the changes reflect in the UI immediately.
  - _Verify:_ Creating a task via chat successfully appends the task onto the board.

---

## Phase X: Verification

### Automated Verifications

- Run linter checks: `npm run lint`
- Run code formatting: `npm run format`
- Compile backend and frontend: `npm run build`

### Manual Checklist

- Open the application and click the chat FAB.
- Ask: _"Quantas tarefas temos concluídas no mês de Junho?"_
- Ask: _"Quem é responsável pela tarefa 'Configurar pipeline de CI/CD'?"_
- Command the agent: _"Crie uma tarefa chamada 'Preparar apresentação acadêmica' para o Danilo começando hoje e terminando na próxima semana."_ Verify it is added to the Backlog column instantly.
- Command the agent: _"Mova a tarefa 'Preparar apresentação acadêmica' para a coluna 'Fazendo'."_ Verify it updates on the screen.
- Ask: _"Quais tarefas estão atrasadas?"_
