// backend/server.js
const express = require('express');
const db = require('./models'); 
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 3001;

require('dotenv').config();
app.use(cors({
  origin: 'https://app-core-frontend-wdvl.onrender.com'
}));
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
const trainingSeriesRoutes = require('./routes/trainingSeriesRoutes');


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
app.use('/notifications', notificationRoutes);
app.use('/progress', express.json(), progressRoutes);
app.use('/training-series', trainingSeriesRoutes);


// --- MIDDLEWARE DE TRATAMENTO DE ERROS ---
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

db.sequelize.sync({ alter: true})
  .then(() => {
    console.log('Base de dados sincronizada com sucesso.');

    console.log('A executar correção única na coluna "trainingId"...');
    const queryInterface = db.sequelize.getQueryInterface();
    return queryInterface.changeColumn(
      'client_exercise_performances', // Nome exato da tabela no plural
      'trainingId',                   // Nome exato da coluna
      {
        type: db.Sequelize.INTEGER,
        allowNull: true,              // <<< A alteração que queremos aplicar
        onDelete: 'SET NULL'          // Manter a propriedade onDelete que já tinhas
      }
    ).then(() => {
      console.log('>>> CORREÇÃO DA COLUNA "trainingId" CONCLUÍDA COM SUCESSO. <<<');
    }).catch(err => {
      // Se a coluna já estiver correta, pode dar um erro "column "trainingId" of relation "..." is already nullable"
      // o que não é um problema.
      console.warn('AVISO ao executar a correção na coluna (pode já estar correta):', err.message);
    });
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