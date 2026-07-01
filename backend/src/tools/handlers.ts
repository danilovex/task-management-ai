import { prisma } from '../db.js';

// --- Handlers de Leitura ---

export async function getTasksSummary(params: {
  month?: number | undefined;
  responsavelId?: number | undefined;
}): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    const where: Record<string, unknown> = {};

    if (params.month !== undefined) {
      const start = new Date(currentYear, params.month, 1);
      const end = new Date(currentYear, params.month + 1, 0, 23, 59, 59);
      where.dataInicio = { gte: start, lte: end };
    }

    if (params.responsavelId !== undefined) {
      where.responsavelId = params.responsavelId;
    }

    const tasks = await prisma.task.findMany({ where });

    const counts = {
      total: tasks.length,
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      verification: tasks.filter((t) => t.status === 'verification').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };

    let filterDesc = '';
    if (params.month !== undefined) {
      const mName = new Date(currentYear, params.month, 1).toLocaleString(
        'pt-BR',
        { month: 'long' },
      );
      filterDesc += ` no mês de ${mName}`;
    }
    if (params.responsavelId !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: params.responsavelId },
      });
      if (user) filterDesc += ` atribuídas a ${user.nome}`;
    }

    return `Resumo das tarefas${filterDesc}:
- Total: ${counts.total}
- Backlog: ${counts.backlog}
- A Fazer: ${counts.todo}
- Fazendo: ${counts.doing}
- Verificação: ${counts.verification}
- Concluídas: ${counts.done}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao obter resumo: ${msg}`;
  }
}

export async function getTasksByResponsible(params: {
  nome: string;
}): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: { nome: { contains: params.nome } },
      include: { tasks: { include: { tags: true } } },
    });

    if (!user) {
      return `Nenhum responsável encontrado com o nome contendo "${params.nome}".`;
    }

    if (user.tasks.length === 0) {
      return `O responsável ${user.nome} (ID: ${user.id}) não possui tarefas atribuídas.`;
    }

    const list = user.tasks
      .map(
        (t) =>
          `- [${t.status.toUpperCase()}] ${t.nome} (Início: ${t.dataInicio.toLocaleDateString('pt-BR')}, Fim: ${t.dataFim.toLocaleDateString('pt-BR')})`,
      )
      .join('\n');

    return `Tarefas atribuídas a ${user.nome} (ID: ${user.id}):\n${list}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao buscar tarefas por responsável: ${msg}`;
  }
}

export async function getTasksByTag(params: {
  tagNome: string;
}): Promise<string> {
  try {
    const tag = await prisma.tag.findFirst({
      where: { nome: { contains: params.tagNome } },
      include: { tasks: { include: { responsavel: true, tags: true } } },
    });

    if (!tag) {
      return `Nenhuma tag encontrada contendo "${params.tagNome}".`;
    }

    if (tag.tasks.length === 0) {
      return `Nenhuma tarefa cadastrada com a tag "${tag.nome}".`;
    }

    const list = tag.tasks
      .map(
        (t) =>
          `- [${t.status.toUpperCase()}] ${t.nome} (Responsável: ${t.responsavel.nome})`,
      )
      .join('\n');

    return `Tarefas com a tag "${tag.nome}":\n${list}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao buscar tarefas por tag: ${msg}`;
  }
}

export async function getOverdueTasks(): Promise<string> {
  try {
    const now = new Date();
    const overdueTasks = await prisma.task.findMany({
      where: {
        dataFim: { lt: now },
        status: { not: 'done' },
      },
      include: { responsavel: true },
    });

    if (overdueTasks.length === 0) {
      return 'Ótimo! Não existem tarefas atrasadas no quadro atualmente.';
    }

    const list = overdueTasks
      .map(
        (t) =>
          `- ${t.nome} (Responsável: ${t.responsavel.nome}, Prazo: ${t.dataFim.toLocaleDateString('pt-BR')}, Status: ${t.status.toUpperCase()})`,
      )
      .join('\n');

    return `Tarefas atrasadas encontradas:\n${list}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao buscar tarefas atrasadas: ${msg}`;
  }
}

// --- Handlers de Escrita ---

export async function createTask(params: {
  nome: string;
  status: string;
  responsavelId: number;
  dataInicio: string;
  dataFim: string;
  tags?: number[] | undefined;
}): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.responsavelId },
    });
    if (!user) {
      return `Erro: Usuário responsável com ID ${params.responsavelId} não existe.`;
    }

    const created = await prisma.task.create({
      data: {
        nome: params.nome,
        status: params.status.toLowerCase(),
        dataInicio: new Date(params.dataInicio),
        dataFim: new Date(params.dataFim),
        responsavelId: params.responsavelId,
        tags: {
          connect: Array.isArray(params.tags)
            ? params.tags.map((id) => ({ id }))
            : [],
        },
      },
      include: { responsavel: true },
    });

    return `Tarefa "${created.nome}" criada com sucesso! ID da tarefa: ${created.id}. Atribuída a ${created.responsavel.nome} na coluna ${created.status.toUpperCase()}.`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao criar tarefa: ${msg}`;
  }
}

export async function updateTaskStatus(params: {
  taskId: string;
  status: string;
}): Promise<string> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
    });
    if (!task) {
      return `Erro: Nenhuma tarefa encontrada com o ID "${params.taskId}".`;
    }

    const finalStatus = params.status.toLowerCase();
    const dataConclusao = finalStatus === 'done' ? new Date() : null;

    const updated = await prisma.task.update({
      where: { id: params.taskId },
      data: { status: finalStatus, dataConclusao },
    });

    return `Tarefa "${updated.nome}" movida com sucesso para a coluna ${finalStatus.toUpperCase()}.`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Erro ao atualizar status da tarefa: ${msg}`;
  }
}
