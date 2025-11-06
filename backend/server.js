// backend/server.js
const express = require('express');
const db = require('./models'); 
const cors = require('cors'); 
const app = express();
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


app.get('/', (req, res) => {
  res.send('Servidor CORE a funcionar!');
});

app.use('/auth', express.json(), authRoutes);
app.use('/users', express.json(), userRoutes);
app.use('/trainings', express.json(), trainingRoutes);
app.use('/appointments', express.json(), appointmentRoutes);
app.use('/staff', express.json(), staffRoutes);
app.use('/payments', paymentRoutes); 
app.use('/exercises', express.json(), exerciseRoutes);
app.use('/workout-plans', express.json(), workoutPlanRoutes);
app.use('/notifications', express.json(), notificationRoutes);
app.use('/progress', express.json(), progressRoutes);
app.use('/training-series', express.json(), trainingSeriesRoutes);
app.use('/push', express.json(), pushRoutes);


// --- MIDDLEWARE DE TRATAMENTO DE ERROS ---
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

db.sequelize.sync({ alter: true})
  .then(() => {
    logger.info('Base de dados sincronizada com sucesso.');
  })
  .catch(err => {
    logger.error('Erro ao sincronizar a base de dados:', err);
  });

db.sequelize.authenticate()
  .then(() => {
    logger.info('Conexão com a base de dados estabelecida com sucesso.');
  })
  .catch(err => {
    logger.error('Não foi possível conectar à base de dados:', err);
  });

app.listen(port, () => {
  logger.info(`Servidor a correr na porta ${port}`);
});