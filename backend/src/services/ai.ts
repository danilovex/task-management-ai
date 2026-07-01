import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import {
  getTasksSummary,
  getTasksByResponsible,
  getTasksByTag,
  getOverdueTasks,
  createTask,
  updateTaskStatus,
} from '../tools/index.js';

// 1. Definição das Ferramentas (Tools) — cascas finas delegando para handlers

const getTasksSummaryTool = tool(async (args) => getTasksSummary(args), {
  name: 'get_tasks_summary',
  description:
    'Obtém o resumo quantitativo de tarefas agrupadas por status, opcionalmente filtrando por mês (0 a 11 para Jan-Dez) e/ou ID do responsável.',
  schema: z.object({
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
  }),
});

const getTasksByResponsibleTool = tool(
  async (args) => getTasksByResponsible(args),
  {
    name: 'get_tasks_by_responsible',
    description:
      'Busca a lista de tarefas associadas a uma pessoa com base em parte do nome informado.',
    schema: z.object({
      nome: z
        .string()
        .describe('Nome ou parte do nome do responsável pelas tarefas'),
    }),
  },
);

const getTasksByTagTool = tool(async (args) => getTasksByTag(args), {
  name: 'get_tasks_by_tag',
  description:
    'Busca todas as tarefas associadas a uma tag ou categoria específica.',
  schema: z.object({
    tagNome: z
      .string()
      .describe(
        'Nome ou palavra-chave da tag (ex: DevOps, UI/UX Design, Software Development)',
      ),
  }),
});

const getOverdueTasksTool = tool(async () => getOverdueTasks(), {
  name: 'get_overdue_tasks',
  description:
    'Busca todas as tarefas do quadro que já passaram da data de término e ainda não estão concluídas.',
  schema: z.object({}),
});

const createTaskTool = tool(async (args) => createTask(args), {
  name: 'create_task',
  description:
    'Cria uma nova tarefa no banco de dados vinculando o responsável e as datas.',
  schema: z.object({
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
  }),
});

const updateTaskStatusTool = tool(async (args) => updateTaskStatus(args), {
  name: 'update_task_status',
  description:
    'Muda o status/coluna de uma tarefa existente (ex: mover para fazendo ou concluído).',
  schema: z.object({
    taskId: z.string().describe('ID único (uuid) da tarefa a ser atualizada'),
    status: z
      .enum(['backlog', 'todo', 'doing', 'verification', 'done'])
      .describe('Novo status da tarefa'),
  }),
});

// Mapeamento de ferramentas por nome
const toolsByName: Record<string, any> = {
  get_tasks_summary: getTasksSummaryTool,
  get_tasks_by_responsible: getTasksByResponsibleTool,
  get_tasks_by_tag: getTasksByTagTool,
  get_overdue_tasks: getOverdueTasksTool,
  create_task: createTaskTool,
  update_task_status: updateTaskStatusTool,
};

const toolsList = Object.values(toolsByName);

// 2. Loop Executor do Agente (Custom implementation)

export async function processChat(
  messages: { role: string; content: string }[],
) {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
  });

  const modelWithTools = model.bindTools(toolsList);

  // Contexto temporal dinâmico
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dynamicSystemPrompt = `Você é um assistente de IA especialista em gerenciar as tarefas do Kanban deste projeto.
Você tem acesso a ferramentas para obter estatísticas, criar, atualizar e listar tarefas do banco de dados SQLite.

INFORMAÇÃO DE CONTEXTO TEMPORAL:
- A data atual do sistema é: ${dateStr}.
- Considere que o ano vigente do projeto/estudo é o ano desta data (${now.getFullYear()}).
- Se o usuário perguntar sobre "este mês", "este ano" ou "hoje", use como base o dia, mês e ano desta data.

REGRAS CRÍTICAS DE ESCOPO:
1. Responda APENAS sobre assuntos relacionados a tarefas, responsáveis, tags e ao quadro Kanban deste projeto.
2. Se o usuário perguntar sobre qualquer outro assunto (como piadas, receitas, futebol, programação geral, história, etc.), você DEVE responder obrigatoriamente e de forma polida: "Desculpe, só posso responder a perguntas relacionadas às tarefas do nosso quadro Kanban." e recusar-se a dar qualquer outra informação. Não tente criar ou inventar respostas fora deste escopo.
3. Seja sempre conciso, direto e profissional em português nas suas interações.`;

  // Reconstrói a lista de mensagens no formato do LangChain
  const history: BaseMessage[] = [new SystemMessage(dynamicSystemPrompt)];

  for (const msg of messages) {
    if (msg.role === 'user') {
      history.push(new HumanMessage(msg.content));
    } else if (msg.role === 'assistant') {
      history.push(new AIMessage(msg.content));
    }
  }

  // Executa o loop do agente (máximo de 5 passos para evitar loops infinitos)
  let steps = 0;
  while (steps < 5) {
    steps++;
    const response = await modelWithTools.invoke(history);

    // Se o modelo não chamou ferramentas, encerra o loop e retorna o texto
    if (!response.tool_calls || response.tool_calls.length === 0) {
      return response.content as string;
    }

    // Se houver chamadas de ferramenta, executa-as e adiciona as respostas ao histórico
    history.push(response);

    for (const tc of response.tool_calls) {
      const toolObj = toolsByName[tc.name];
      let toolOutput = '';

      if (toolObj) {
        toolOutput = await toolObj.invoke(tc.args);
      } else {
        toolOutput = `Ferramenta "${tc.name}" não encontrada.`;
      }

      history.push(
        new ToolMessage({
          content: toolOutput,
          tool_call_id: tc.id || '',
          name: tc.name,
        }),
      );
    }
  }

  return 'Desculpe, excedi o número de chamadas internas permitidas para processar essa solicitação.';
}
