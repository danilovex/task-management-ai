import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db.js';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---

// 1. Obter todas as tarefas (com responsavel e tags)
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        responsavel: true,
        tags: true,
      },
      orderBy: {
        dataInicio: 'asc',
      },
    });
    res.json(tasks);
  } catch (error: any) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro interno ao buscar tarefas' });
  }
});

// 2. Criar uma nova tarefa
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const {
      nome,
      responsavelId,
      dataInicio,
      dataFim,
      dataConclusao,
      status,
      tags,
    } = req.body;

    if (!nome || !responsavelId || !dataInicio || !dataFim || !status) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      return;
    }

    const newTask = await prisma.task.create({
      data: {
        nome,
        status,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        dataConclusao: dataConclusao ? new Date(dataConclusao) : null,
        responsavelId: Number(responsavelId),
        tags: {
          connect: Array.isArray(tags)
            ? tags.map((id: number) => ({ id }))
            : [],
        },
      },
      include: {
        responsavel: true,
        tags: true,
      },
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro interno ao criar tarefa' });
  }
});

// 3. Atualizar uma tarefa
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      nome,
      responsavelId,
      dataInicio,
      dataFim,
      dataConclusao,
      status,
      tags,
    } = req.body;

    // Busca a tarefa existente
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    // Gerenciamento lógico do status 'done' e da data de conclusão
    let finalDataConclusao =
      dataConclusao !== undefined
        ? dataConclusao
          ? new Date(dataConclusao)
          : null
        : existingTask.dataConclusao;
    if (status === 'done' && !finalDataConclusao) {
      finalDataConclusao = new Date();
    } else if (status && status !== 'done') {
      finalDataConclusao = null;
    }

    // Preparação para atualizar conexões de tags se enviadas
    const tagUpdate: any = {};
    if (Array.isArray(tags)) {
      // Desconecta todas as antigas e conecta as novas
      tagUpdate.disconnect = (existingTask as any).tags.map((t: any) => ({
        id: t.id,
      }));
      tagUpdate.connect = tags.map((id: number) => ({ id }));
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        nome: nome ?? existingTask.nome,
        status: status ?? existingTask.status,
        dataInicio: dataInicio ? new Date(dataInicio) : existingTask.dataInicio,
        dataFim: dataFim ? new Date(dataFim) : existingTask.dataFim,
        dataConclusao: finalDataConclusao,
        responsavelId: responsavelId
          ? Number(responsavelId)
          : existingTask.responsavelId,
        tags: tagUpdate,
      },
      include: {
        responsavel: true,
        tags: true,
      },
    });

    res.json(updatedTask);
  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar tarefa' });
  }
});

// 4. Excluir uma tarefa
app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro interno ao excluir tarefa' });
  }
});

// 5. Obter todos os responsáveis (Users)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { nome: 'asc' },
    });
    res.json(users);
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno ao buscar usuários' });
  }
});

// 6. Obter todas as tags
app.get('/api/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { nome: 'asc' },
    });
    res.json(tags);
  } catch (error: any) {
    console.error('Erro ao buscar tags:', error);
    res.status(500).json({ error: 'Erro interno ao buscar tags' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${PORT}`);
});
