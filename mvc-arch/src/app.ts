import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importa as rotas
import investorRoutes from './routes/investorRoutes';
import assetRoutes from './routes/assetRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import transactionRoutes from './routes/transactionRoutes';
import goalRoutes from './routes/goalRoutes';

// Configura as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());

// Configuração do CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, // 10000 para testes
  message: {
    success: false,
    error: 'Muitas tentativas, tente novamente em 15 minutos',
  },
});

if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Gerenciamento Financeiro está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API
app.use('/api/investor', investorRoutes);
app.use('/api/asset', assetRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goal', goalRoutes);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl,
  });
});

// Middleware global de tratamento de erros
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', error);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
});

// Tratamento para encerramento gracioso
process.on('SIGTERM', () => {
  console.log('👋 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Encerrando servidor...');
  process.exit(0);
});

export default app;