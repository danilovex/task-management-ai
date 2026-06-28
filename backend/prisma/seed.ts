import { prisma } from '../src/db.js';

const USERS = [
  'Danilo Ramalho',
  'Ana Silva',
  'Bruno Santos',
  'Carla Oliveira',
  'Diego Costa',
  'Elena Rocha',
];

const TAGS = [
  'Software Development',
  'Digital Marketing',
  'Project Management',
  'DevOps',
  'UI/UX Design',
  'QA Testing',
  'Content Creation',
  'Data Science',
];

const TASK_TEMPLATES = [
  // Software Development
  {
    nome: 'Implementar autenticação JWT',
    tags: ['Software Development', 'DevOps'],
  },
  {
    nome: 'Corrigir vazamento de memória na API',
    tags: ['Software Development', 'QA Testing'],
  },
  {
    nome: 'Refatorar hooks de estado do frontend',
    tags: ['Software Development', 'UI/UX Design'],
  },
  {
    nome: 'Configurar pipeline de CI/CD',
    tags: ['DevOps', 'Project Management'],
  },
  {
    nome: 'Desenvolver módulo de relatórios PDF',
    tags: ['Software Development'],
  },
  {
    nome: 'Criar testes de integração para rotas de tarefas',
    tags: ['QA Testing', 'Software Development'],
  },
  // UI/UX
  {
    nome: 'Desenhar protótipo de alta fidelidade do dashboard',
    tags: ['UI/UX Design'],
  },
  {
    nome: 'Realizar testes de usabilidade com usuários',
    tags: ['UI/UX Design', 'QA Testing'],
  },
  {
    nome: 'Ajustar contraste e acessibilidade do tema escuro',
    tags: ['UI/UX Design'],
  },
  // Marketing Digital
  {
    nome: 'Planejar campanha de lançamento de produto',
    tags: ['Digital Marketing', 'Project Management'],
  },
  {
    nome: 'Redigir posts semanais para blog',
    tags: ['Digital Marketing', 'Content Creation'],
  },
  {
    nome: 'Analisar métricas de conversão de anúncios',
    tags: ['Digital Marketing', 'Data Science'],
  },
  {
    nome: 'Otimizar SEO da landing page principal',
    tags: ['Digital Marketing', 'Software Development'],
  },
  // Gestão de Projetos
  {
    nome: 'Reunião de alinhamento com stakeholders',
    tags: ['Project Management'],
  },
  {
    nome: 'Definir cronograma e metas da Sprint',
    tags: ['Project Management'],
  },
  {
    nome: 'Elaborar matriz de riscos do projeto',
    tags: ['Project Management'],
  },
  // Outros
  {
    nome: 'Treinar equipe na nova ferramenta de analytics',
    tags: ['Data Science', 'Project Management'],
  },
  {
    nome: 'Elaborar relatório de performance do banco de dados',
    tags: ['DevOps', 'Data Science'],
  },
];

async function main() {
  console.log('Starting database seeding...');

  // Limpa o banco de dados antes do seed
  await prisma.task.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating users...');
  const users = await Promise.all(
    USERS.map((nome) => prisma.user.create({ data: { nome } })),
  );

  console.log('Creating tags...');
  const tagsMap: Record<string, any> = {};
  for (const tagName of TAGS) {
    const createdTag = await prisma.tag.create({ data: { nome: tagName } });
    tagsMap[tagName] = createdTag;
  }

  const currentYear = 2026;
  const statuses = ['backlog', 'todo', 'doing', 'verification', 'done'];

  console.log('Generating monthly tasks for 2026...');

  for (let month = 0; month < 12; month++) {
    // Para cada mês, criar cerca de 10 tarefas
    for (let i = 0; i < 10; i++) {
      const template =
        TASK_TEMPLATES[(month * 10 + i) % TASK_TEMPLATES.length]!;
      const user = users[(month * 3 + i) % users.length]!;

      // Distribuição de status baseada no mês
      // Ex: meses passados (jan-maio) terão mais "done", meses futuros/atuais terão mais "todo", "doing", "backlog"
      let status = 'todo';
      if (month < 5) {
        status = Math.random() > 0.15 ? 'done' : 'verification';
      } else if (month === 5) {
        // Junho (mês atual)
        const rand = Math.random();
        status =
          rand < 0.3
            ? 'doing'
            : rand < 0.6
              ? 'todo'
              : rand < 0.8
                ? 'verification'
                : 'done';
      } else {
        status = Math.random() > 0.4 ? 'todo' : 'backlog';
      }

      // Gerar datas realistas dentro do mês correspondente
      const startDay = 1 + Math.floor(Math.random() * 15);
      const duration = 3 + Math.floor(Math.random() * 10);
      const endDay = startDay + duration;

      const dataInicio = new Date(currentYear, month, startDay, 9, 0, 0);
      const dataFim = new Date(currentYear, month, endDay, 18, 0, 0);
      let dataConclusao: Date | null = null;

      if (status === 'done') {
        // Conclusão no final do período ou um pouco antes
        const conclusionDay = startDay + Math.floor(Math.random() * duration);
        dataConclusao = new Date(currentYear, month, conclusionDay, 17, 0, 0);
      }

      // Adicionar número do mês e index ao nome para ficar fácil de testar/visualizar
      const monthName = new Date(currentYear, month, 1).toLocaleString(
        'pt-BR',
        { month: 'long' },
      );
      const capitalizedMonth =
        monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const taskNome = `${template.nome} (${capitalizedMonth} #${i + 1})`;

      // Pegar tags do template
      const taskTags = template.tags.map((tName) => ({
        id: tagsMap[tName].id,
      }));

      await prisma.task.create({
        data: {
          nome: taskNome,
          status,
          dataInicio,
          dataFim,
          dataConclusao,
          responsavelId: user.id,
          tags: {
            connect: taskTags,
          },
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
