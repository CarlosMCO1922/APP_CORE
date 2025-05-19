// backend/server.js

const express = require('express');

// Importa o objeto db de models/index.js, que contém todos os modelos e a instância sequelize
const db = require('./models'); 
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 3001;

require('dotenv').config();
app.use(cors()); 
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor CORE a funcionar!');
});

// --- ROTAS ---
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);
const trainingRoutes = require('./routes/trainingRoutes');
app.use('/trainings', trainingRoutes);
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/appointments', appointmentRoutes);
const staffRoutes = require('./routes/staffRoutes');
app.use('/staff', staffRoutes);
const paymentRoutes = require('./routes/paymentRoutes'); 
app.use('/payments', paymentRoutes);
const exerciseRoutes = require('./routes/exerciseRoutes');
app.use('/exercises', exerciseRoutes);
const workoutPlanRoutes = require('./routes/workoutPlanRoutes');
app.use('/workout-plans', workoutPlanRoutes);

// --- MIDDLEWARE DE TRATAMENTO DE ERROS ---
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Middleware para rotas não encontradas (404) - DEPOIS de todas as rotas da API
app.use(notFound);

// Middleware de tratamento de erros - O ÚLTIMO middleware a ser adicionado
app.use(errorHandler);

// Sincronizar a base de dados (cria as tabelas e as associações se não existirem)
// Usa db.sequelize em vez de apenas sequelize
db.sequelize.sync({ alter: true}) // force: true irá apagar e recriar as tabelas. Cuidado!
  .then(() => {
    console.log('Base de dados sincronizada com sucesso.');
    // Podes adicionar aqui lógica para criar um utilizador admin inicial se não existir
  })
  .catch(err => {
    console.error('Erro ao sincronizar a base de dados:', err);
  });

// Autenticar a ligação à base de dados
db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com a base de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Não foi possível conectar à base de dados:', err);
  });




// Futuramente, as tuas rotas virão aqui:
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// ...
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// ...

app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
