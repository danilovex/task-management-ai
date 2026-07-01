import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import { AIChatDrawer } from './components/AIChatDrawer';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const API_BASE = 'http://localhost:3001/api';

interface User {
  id: number;
  nome: string;
}

interface Tag {
  id: number;
  nome: string;
}

interface Task {
  id: string;
  nome: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  dataConclusao: string | null;
  responsavelId: number;
  responsavel: User;
  tags: Tag[];
}

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#eceff1' },
  { id: 'todo', title: 'A Fazer', color: '#e3f2fd' },
  { id: 'doing', title: 'Fazendo', color: '#fff9c4' },
  { id: 'verification', title: 'Verificação', color: '#f3e5f5' },
  { id: 'done', title: 'Concluído', color: '#e8f5e9' },
];

const MONTHS = [
  { value: 'all', label: 'Todos os Meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

const TAG_COLORS: Record<string, string> = {
  'Software Development': '#2196f3',
  'Digital Marketing': '#e91e63',
  'Project Management': '#4caf50',
  DevOps: '#ff9800',
  'UI/UX Design': '#9c27b0',
  'QA Testing': '#00bcd4',
  'Content Creation': '#795548',
  'Data Science': '#607d8b',
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('5'); // Junho (mês atual no seed) por padrão
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Campos do formulário
  const [formNome, setFormNome] = useState('');
  const [formResponsavelId, setFormResponsavelId] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState('todo');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formSelectedTags, setFormSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resTasks, resUsers, resTags] = await Promise.all([
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/tags`),
      ]);

      const dataTasks = await resTasks.json();
      const dataUsers = await resUsers.json();
      const dataTags = await resTags.json();

      setTasks(dataTasks);
      setUsers(dataUsers);
      setTags(dataTags);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Atualização otimista do estado local
    const updatedTasks = tasks.map((task) => {
      if (task.id === draggableId) {
        return {
          ...task,
          status: destination.droppableId,
          dataConclusao:
            destination.droppableId === 'done'
              ? new Date().toISOString()
              : null,
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    // Envia a mudança para o servidor
    try {
      await fetch(`${API_BASE}/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destination.droppableId }),
      });
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      // Recarrega em caso de falha
      fetchData();
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormNome('');
    setFormResponsavelId('');
    setFormStatus('todo');

    // Datas padrão: hoje e hoje + 7 dias
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    setFormDataInicio(today.toISOString().split('T')[0]!);
    setFormDataFim(nextWeek.toISOString().split('T')[0]!);
    setFormSelectedTags([]);
    setOpenDialog(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormNome(task.nome);
    setFormResponsavelId(task.responsavelId);
    setFormStatus(task.status);
    setFormDataInicio(task.dataInicio.split('T')[0]!);
    setFormDataFim(task.dataFim.split('T')[0]!);
    setFormSelectedTags(task.tags.map((t) => t.id));
    setOpenDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome || !formResponsavelId || !formDataInicio || !formDataFim) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const taskData = {
      nome: formNome,
      responsavelId: formResponsavelId,
      status: formStatus,
      dataInicio: new Date(formDataInicio).toISOString(),
      dataFim: new Date(formDataFim).toISOString(),
      tags: formSelectedTags,
    };

    try {
      if (editingTask) {
        // Atualização
        const res = await fetch(`${API_BASE}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) fetchData();
      } else {
        // Criação
        const res = await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) fetchData();
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Filtrar tarefas baseadas nas seleções
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.responsavel.nome.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedMonth === 'all') {
      return matchesSearch;
    }

    const taskDate = new Date(task.dataInicio);
    const matchesMonth = taskDate.getMonth().toString() === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho */}
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: '#ffffff',
        }}
      >
        <Toolbar
          sx={{
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              📊{' '}
              <Box component="span" sx={{ color: 'text.primary' }}>
                Kanban Task Manager
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Busca */}
            <TextField
              size="small"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: 'text.secondary', fontSize: '1.2rem' }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: 250,
                bgcolor: '#f1f3f4',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: 'none' },
                },
                input: { color: 'text.primary', fontSize: '0.85rem' },
              }}
            />

            {/* Filtro de Mês */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#f1f3f4',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
              }}
            >
              <FilterAltIcon
                sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }}
              />
              <FormControl
                size="small"
                variant="standard"
                sx={{ minWidth: 120 }}
              >
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disableUnderline
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Conteúdo Principal */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: 3,
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              overflowX: 'auto',
              pb: 2,
              height: '100%',
              alignItems: 'stretch',
            }}
          >
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <Paper
                  key={col.id}
                  elevation={0}
                  sx={{
                    width: 320,
                    minWidth: 320,
                    flexShrink: 0,
                    bgcolor: col.color,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    maxHeight: '100%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {col.title}
                    </Typography>
                    <Chip
                      label={colTasks.length}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                      }}
                    />
                  </Box>

                  <Droppable droppableId={col.id}>
                    {(provided, _snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          flexGrow: 1,
                          minHeight: '50vh',
                          transition: 'background-color 0.2s',
                          borderRadius: 2,
                        }}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(providedDraggable, snapshotDraggable) => (
                              <Card
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                {...providedDraggable.dragHandleProps}
                                sx={{
                                  mb: 2,
                                  boxShadow: snapshotDraggable.isDragging
                                    ? '0px 8px 24px rgba(0,0,0,0.15)'
                                    : '0px 2px 4px rgba(0,0,0,0.05)',
                                  transform:
                                    providedDraggable.draggableProps.style
                                      ?.transform,
                                }}
                              >
                                <CardContent
                                  sx={{ p: 2, '&:last-child': { pb: 1 } }}
                                >
                                  {/* Nome da Tarefa */}
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      mb: 1.5,
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {task.nome}
                                  </Typography>

                                  {/* Tags */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 0.5,
                                      mb: 2,
                                    }}
                                  >
                                    {task.tags.map((tag) => (
                                      <Chip
                                        key={tag.id}
                                        label={tag.nome}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                          color: '#fff',
                                          bgcolor:
                                            TAG_COLORS[tag.nome] || '#757575',
                                        }}
                                      />
                                    ))}
                                  </Box>

                                  {/* Responsável e Datas */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Tooltip
                                        title={`Responsável: ${task.responsavel.nome}`}
                                      >
                                        <Avatar
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            fontSize: '0.7rem',
                                            bgcolor: 'secondary.main',
                                            fontWeight: 'bold',
                                          }}
                                        >
                                          {getInitials(task.responsavel.nome)}
                                        </Avatar>
                                      </Tooltip>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: 'text.secondary',
                                      }}
                                    >
                                      <CalendarTodayIcon
                                        sx={{ fontSize: '0.8rem' }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: '0.7rem' }}
                                      >
                                        {new Date(
                                          task.dataInicio,
                                        ).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                        })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </CardContent>

                                <CardActions
                                  sx={{
                                    justifyContent: 'flex-end',
                                    py: 0.5,
                                    px: 1,
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(task)}
                                  >
                                    <EditIcon sx={{ fontSize: '1rem' }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(task.id)}
                                  >
                                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                                  </IconButton>
                                </CardActions>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              );
            })}
          </Box>
        </DragDropContext>
      </Box>

      {/* Botão do Chat do Agente de IA */}
      <Fab
        color="secondary"
        aria-label="chat"
        onClick={() => setChatOpen(true)}
        sx={{ position: 'fixed', bottom: 96, right: 24 }}
      >
        <SmartToyIcon />
      </Fab>

      {/* Botão de Nova Tarefa */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpenCreate}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>

      {/* Gaveta do Chat do Agente de IA */}
      <AIChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onTaskMutated={fetchData}
      />

      {/* Modal Criar / Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>
            {editingTask ? '📝 Editar Tarefa' : '🆕 Nova Tarefa'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nome da Tarefa"
                  variant="outlined"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={formResponsavelId}
                    onChange={(e) =>
                      setFormResponsavelId(Number(e.target.value))
                    }
                    label="Responsável"
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    label="Status"
                  >
                    {COLUMNS.map((col) => (
                      <MenuItem key={col.id} value={col.id}>
                        {col.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Data de Início"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={formDataInicio}
                  onChange={(e) => setFormDataInicio(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Data de Término"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={formDataFim}
                  onChange={(e) => setFormDataFim(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Tags / Categorias</InputLabel>
                  <Select
                    multiple
                    value={formSelectedTags}
                    onChange={(e) =>
                      setFormSelectedTags(e.target.value as number[])
                    }
                    input={<OutlinedInput label="Tags / Categorias" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const tagObj = tags.find((t) => t.id === val);
                          return (
                            <Chip
                              key={val}
                              label={tagObj ? tagObj.nome : val}
                              size="small"
                              sx={{
                                height: 22,
                                color: '#fff',
                                bgcolor: tagObj
                                  ? TAG_COLORS[tagObj.nome] || '#757575'
                                  : '#757575',
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {tags.map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        {tag.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default App;
