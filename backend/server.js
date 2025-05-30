// backend/server.js
const express = require('express');
const db = require('./models'); 
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 3001;

require('dotenv').config();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.get('/', (req, res) => {
  res.send('Servidor CORE a funcionar!');
});

// Para as rotas que precisam de JSON parseado, adiciona o middleware individualmente:
app.use('/auth', express.json(), authRoutes);
app.use('/users', express.json(), userRoutes);
app.use('/trainings', express.json(), trainingRoutes);
app.use('/appointments', express.json(), appointmentRoutes);
app.use('/staff', express.json(), staffRoutes);
// paymentRoutes já lida com express.raw para o webhook e pode usar express.json() internamente para outras sub-rotas se necessário
app.use('/payments', paymentRoutes); // Não adicionar express.json() globalmente aqui
app.use('/exercises', express.json(), exerciseRoutes);
app.use('/workout-plans', express.json(), workoutPlanRoutes);
app.use('/notifications', notificationRoutes);
app.use('/progress', express.json(), progressRoutes);


// --- MIDDLEWARE DE TRATAMENTO DE ERROS ---
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

db.sequelize.sync({ alter: true})
  .then(() => {
    console.log('Base de dados sincronizada com sucesso.');
  })
  .catch(err => {
    console.error('Erro ao sincronizar a base de dados:', err);
  });

db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com a base de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Não foi possível conectar à base de dados:', err);
  });

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});