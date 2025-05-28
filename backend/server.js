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

// Aplica express.json() aqui para todas as rotas QUE PRECISAM dele,
// APÓS a rota do webhook ter tido a chance de usar express.raw().
// No entanto, a abordagem mais comum e limpa é deixar o express.raw()
// na própria definição da rota do webhook ter prioridade.

// A configuração correta é que paymentRoutes.js já lida com o express.raw()
// especificamente para /stripe-webhook.
// O app.use(express.json()) global ANTES das rotas pode ser o problema se
// ele processar o corpo antes do express.raw() específico da rota.

// Vamos tentar colocar o express.json() DEPOIS da montagem da rota de pagamentos
// ou usar uma abordagem condicional.

// Temporariamente, para testar, vamos remover o app.use(express.json()) global
// e adicionar express.json() individualmente às rotas que precisam, exceto a de pagamentos.
// ESTA É UMA MUDANÇA SIGNIFICATIVA PARA TESTE.

// app.use(express.json()); // COMENTA OU REMOVE ESTA LINHA GLOBAL POR AGORA

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