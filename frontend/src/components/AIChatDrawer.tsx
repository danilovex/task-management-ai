import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Paper,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatDrawerProps {
  open: boolean;
  onClose: () => void;
  onTaskMutated: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  open,
  onClose,
  onTaskMutated,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou seu assistente de IA especialista em Kanban. Posso te ajudar a responder dúvidas de estatísticas das tarefas (mensal ou anual), tarefas por responsável/tag, tarefas atrasadas, além de criar ou mover tarefas. O que você gostaria de fazer?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage } as Message,
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);

      // Se a mensagem do usuário parece ser um comando de mutação (criar ou mover),
      // dispara a atualização do Kanban
      const lower = userMessage.toLowerCase();
      if (
        lower.includes('crie') ||
        lower.includes('criar') ||
        lower.includes('cadastrar') ||
        lower.includes('mova') ||
        lower.includes('mover') ||
        lower.includes('atualize') ||
        lower.includes('mude')
      ) {
        // Aguarda um pequeno delay para garantir que o banco persistiu antes da query do frontend
        setTimeout(() => {
          onTaskMutated();
        }, 800);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Desculpe, tive um problema de comunicação com o servidor. Verifique se o backend e a API Key da OpenAI estão configurados.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0, 0, 0, 0.1)' },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: 400 },
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Assistente IA Kanban
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Message History */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <ListItem
                key={index}
                disableGutters
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                {!isUser && (
                  <Avatar
                    sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}
                  >
                    <SmartToyIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    borderRadius: 2,
                    bgcolor: isUser ? 'primary.main' : '#ffffff',
                    color: isUser ? 'primary.contrastText' : 'text.primary',
                    border: isUser ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>

                {isUser && (
                  <Avatar
                    sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}
                  >
                    <PersonIcon sx={{ fontSize: '1rem' }} />
                  </Avatar>
                )}
              </ListItem>
            );
          })}

          {loading && (
            <ListItem disableGutters sx={{ display: 'flex', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                <SmartToyIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Pensando...
                </Typography>
              </Paper>
            </ListItem>
          )}

          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Pergunte sobre as tarefas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            borderRadius: '50%',
            minWidth: 40,
            width: 40,
            height: 40,
            p: 0,
          }}
        >
          <SendIcon sx={{ fontSize: '1.2rem' }} />
        </Button>
      </Box>
    </Drawer>
  );
};
