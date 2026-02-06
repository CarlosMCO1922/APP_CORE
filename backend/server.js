// backend/server.js
const express = require('express');
const http = require('http');
const db = require('./models'); 
const cors = require('cors'); 
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

require('dotenv').config();
const logger = require('./utils/logger');
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://app-core-frontend-wdvl.onrender.com,http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  }
}));

// NÃO uses app.use(express.json()); globalmente ANTES da rota do webhook
// Vamos aplicar express.json() e express.raw() de forma mais granular ou após a rota do webhook

// --- ROTAS ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Este já tem express.raw para o webhook
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutPlanRoutes = require('./routes/workoutPlanRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const trainingSeriesRoutes = require('./routes/trainingSeriesRoutes');
const pushRoutes = require('./routes/pushRoutes');
const logRoutes = require('./routes/logRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { rateLimit } = require('express-rate-limit');

// Rate limiting apenas nas rotas públicas (proteção contra abuso sem afetar utilizadores autenticados)
const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: 'Muitos pedidos. Tenta novamente dentro de alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.send('Servidor CORE a funcionar!');
});

app.use('/auth', express.json(), authRoutes);
app.use('/users', express.json(), userRoutes);
app.use('/trainings', express.json(), trainingRoutes);
app.use('/appointments', express.json(), appointmentRoutes);
app.use('/staff', express.json(), staffRoutes);
app.use('/payments', express.json(), paymentRoutes); 
app.use('/exercises', express.json(), exerciseRoutes);
app.use('/workout-plans', express.json(), workoutPlanRoutes);
app.use('/notifications', express.json(), notificationRoutes);
app.use('/progress', express.json(), progressRoutes);
app.use('/training-series', express.json(), trainingSeriesRoutes);
app.use('/push', express.json(), pushRoutes);
app.use('/logs', express.json(), logRoutes);
app.use('/public', publicRateLimiter, express.json(), publicRoutes);

// --- MIDDLEWARE DE TRATAMENTO DE ERROS ---
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { cleanupExpiredDrafts } = require('./controllers/progressController');
const { cleanupOldLogs } = require('./controllers/logController');

app.use(notFound);
app.use(errorHandler);

// Sync da base de dados - usar alter: true apenas em desenvolvimento
// Em produção, usar migrações manuais para evitar problemas com alterações de schema
const syncOptions = process.env.NODE_ENV === 'production' 
  ? { alter: false } // Em produção, não fazer alterações automáticas
  : { alter: true }; // Em desenvolvimento, permitir alterações

db.sequelize.sync(syncOptions)
  .then(() => {
    logger.info(`Base de dados sincronizada com sucesso (modo: ${process.env.NODE_ENV || 'development'}).`);
  })
  .catch(err => {
    logger.error('Erro ao sincronizar a base de dados:', err);
    // Em produção, não bloquear o servidor se houver erro de sync
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Servidor continuará a funcionar mesmo com erro de sincronização. Verifique a base de dados manualmente.');
    } else {
      // Em desenvolvimento, o erro é crítico
      throw err;
    }
  });

db.sequelize.authenticate()
  .then(() => {
    logger.info('Conexão com a base de dados estabelecida com sucesso.');
  })
  .catch(err => {
    logger.error('Não foi possível conectar à base de dados:', err);
  });

// Limpeza automática de drafts expirados
// Executa a cada hora (3600000 ms)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora

// Limpeza automática de logs antigos
// Executa diariamente (24 horas)
const LOGS_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
const LOGS_DAYS_TO_KEEP = parseInt(process.env.LOGS_RETENTION_DAYS || '90', 10); // 90 dias por padrão

const startCleanupJob = () => {
  // Executar limpeza de drafts imediatamente ao iniciar
  cleanupExpiredDrafts().catch(err => {
    logger.error('Erro na limpeza inicial de drafts:', err);
  });

  // Executar limpeza de drafts periodicamente
  setInterval(() => {
    cleanupExpiredDrafts().catch(err => {
      logger.error('Erro na limpeza periódica de drafts:', err);
    });
  }, CLEANUP_INTERVAL);

  logger.info(`Limpeza automática de drafts configurada (intervalo: ${CLEANUP_INTERVAL / 1000 / 60} minutos)`);

  // Executar limpeza de logs antigos diariamente
  setInterval(() => {
    cleanupOldLogs(LOGS_DAYS_TO_KEEP).catch(err => {
      logger.error('Erro na limpeza periódica de logs:', err);
    });
  }, LOGS_CLEANUP_INTERVAL);

  logger.info(`Limpeza automática de logs configurada (intervalo: ${LOGS_CLEANUP_INTERVAL / 1000 / 60 / 60} horas, mantém últimos ${LOGS_DAYS_TO_KEEP} dias)`);
};

// Inicializar WebSocket server
const { initializeWebSocket } = require('./utils/websocketServer');
initializeWebSocket(server);

server.listen(port, () => {
  logger.info(`Servidor a correr na porta ${port}`);
  // Iniciar job de limpeza após servidor iniciar
  startCleanupJob();
});