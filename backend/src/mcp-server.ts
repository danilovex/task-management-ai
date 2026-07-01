import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  getTasksSummary,
  getTasksByResponsible,
  getTasksByTag,
  getOverdueTasks,
  createTask,
  updateTaskStatus,
} from './tools/index.js';

const server = new McpServer({
  name: 'task-management-kanban',
  version: '1.0.0',
});

// --- Tools de Leitura ---

server.tool(
  'get_tasks_summary',
  'Obtém o resumo quantitativo de tarefas agrupadas por status, opcionalmente filtrando por mês (0 a 11 para Jan-Dez) e/ou ID do responsável.',
  {
    month: z
      .number()
      .min(0)
      .max(11)
      .optional()
      .describe('Mês da busca (0 = Janeiro, 11 = Dezembro)'),
    responsavelId: z
      .number()
      .optional()
      .describe('ID numérico do responsável pelas tarefas'),
  },
  async (args) => ({
    content: [{ type: 'text' as const, text: await getTasksSummary(args) }],
  }),
);

server.tool(
  'get_tasks_by_responsible',
  'Busca a lista de tarefas associadas a uma pessoa com base em parte do nome informado.',
  {
    nome: z
      .string()
      .describe('Nome ou parte do nome do responsável pelas tarefas'),
  },
  async (args) => ({
    content: [
      { type: 'text' as const, text: await getTasksByResponsible(args) },
    ],
  }),
);

server.tool(
  'get_tasks_by_tag',
  'Busca todas as tarefas associadas a uma tag ou categoria específica.',
  {
    tagNome: z
      .string()
      .describe(
        'Nome ou palavra-chave da tag (ex: DevOps, UI/UX Design, Software Development)',
      ),
  },
  async (args) => ({
    content: [{ type: 'text' as const, text: await getTasksByTag(args) }],
  }),
);

server.tool(
  'get_overdue_tasks',
  'Busca todas as tarefas do quadro que já passaram da data de término e ainda não estão concluídas.',
  {},
  async () => ({
    content: [{ type: 'text' as const, text: await getOverdueTasks() }],
  }),
);

// --- Tools de Escrita ---

server.tool(
  'create_task',
  'Cria uma nova tarefa no banco de dados vinculando o responsável e as datas.',
  {
    nome: z.string().describe('Nome/título descritivo da tarefa'),
    status: z
      .enum(['backlog', 'todo', 'doing', 'verification', 'done'])
      .describe('Coluna inicial da tarefa'),
    responsavelId: z
      .number()
      .describe(
        'ID numérico do usuário responsável (verifique o ID antes de chamar)',
      ),
    dataInicio: z
      .string()
      .describe('Data de início em formato ISO (YYYY-MM-DD)'),
    dataFim: z
      .string()
      .describe('Data limite/término em formato ISO (YYYY-MM-DD)'),
    tags: z
      .array(z.number())
      .optional()
      .describe('Lista de IDs numéricos das tags a associar'),
  },
  async (args) => ({
    content: [{ type: 'text' as const, text: await createTask(args) }],
  }),
);

server.tool(
  'update_task_status',
  'Muda o status/coluna de uma tarefa existente (ex: mover para fazendo ou concluído).',
  {
    taskId: z.string().describe('ID único (uuid) da tarefa a ser atualizada'),
    status: z
      .enum(['backlog', 'todo', 'doing', 'verification', 'done'])
      .describe('Novo status da tarefa'),
  },
  async (args) => ({
    content: [{ type: 'text' as const, text: await updateTaskStatus(args) }],
  }),
);

// Iniciar o servidor MCP via Stdio
const transport = new StdioServerTransport();
await server.connect(transport);
