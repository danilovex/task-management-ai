import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env (se existir)
dotenv.config();

const app = express();
// Define a porta do servidor (usa a do ambiente ou a 3001 por padrão)
const PORT = process.env.PORT || 3001;

// Middlewares (Funções de segurança e leitura de dados)
app.use(cors()); // Permite que o seu frontend (Vite) acesse esta API
app.use(express.json()); // Permite que o servidor entenda dados em formato JSON

// Rota inicial de teste
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Olá do servidor Node.js com TypeScript!' });
});

// Inicia o servidor na porta configurada
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${PORT}`);
});
