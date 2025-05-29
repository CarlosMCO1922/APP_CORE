// backend/controllers/trainingController.js
const { Op } = require('sequelize'); // Para operadores como "greater than or equal"
const db = require('../models');
const { startOfWeek, endOfWeek, format } = require('date-fns');
const { _internalCreateNotification } = require('./notificationController');

// @desc    Criar um novo treino
// @route   POST /api/trainings
// @access  Privado (Admin Staff)
const createTraining = async (req, res) => {
  const { name, description, date, time, capacity, instructorId } = req.body;

  // Validação básica de entrada
  if (!name || !date || !time || !capacity || !instructorId) {
    return res.status(400).json({ message: 'Por favor, forneça nome, data, hora, capacidade e ID do instrutor.' });
  }
  if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
    return res.status(400).json({ message: 'A capacidade deve ser um número positivo.' });
  }
  if (isNaN(parseInt(instructorId))) {
      return res.status(400).json({ message: 'O ID do instrutor deve ser um número.' });
  }

  try {
    // Verificar se o instrutor (Staff) existe
    const instructor = await db.Staff.findByPk(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Instrutor não encontrado.' });
    }
    // Opcional: Verificar se o role do instrutor é 'trainer' ou 'admin'
    if (!['trainer', 'admin'].includes(instructor.role)) {
        return res.status(400).json({ message: 'O ID fornecido não pertence a um instrutor ou administrador válido.' });
    }

    const newTraining = await db.Training.create({
      name,
      description,
      date,
      time,
      capacity: parseInt(capacity),
      instructorId: parseInt(instructorId),
    });

    if (newTraining.instructorId) {
      _internalCreateNotification({
        recipientStaffId: newTraining.instructorId,
        message: `Foi-lhe atribuído um novo treino: "${newTraining.name}" no dia ${format(new Date(newTraining.date), 'dd/MM/yyyy')} às ${newTraining.time.substring(0,5)}.`,
        type: 'NEW_TRAINING_ASSIGNED',
        relatedResourceId: newTraining.id,
        relatedResourceType: 'training',
        link: `/calendario` // Ou um link específico para o treino no painel do staff
      });
    }

    res.status(201).json(newTraining);
  } catch (error) {
    console.error('Erro ao criar treino:', error);
    // Verificar erros de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar o treino.', error: error.message });
  }
};

// @desc    Listar todos os treinos disponíveis
// @route   GET /api/trainings
// @access  Privado (Qualquer utilizador autenticado)
const getAllTrainings = async (req, res) => {
  try {
    // Por agora, retorna todos os treinos. Filtros (ex: data futura) podem ser adicionados.
    // A informação de quem está inscrito já vem com o include 'participants'.
    const trainings = await db.Training.findAll({
      include: [
        {
          model: db.Staff,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
        {
          model: db.User,
          as: 'participants', // Alias definido na associação Training -> User
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: [] }, // Não incluir atributos da tabela de junção
        },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    // Adicionar a contagem de participantes a cada treino para facilitar no frontend
    const trainingsWithParticipantCount = trainings.map(training => {
        const trainingJSON = training.toJSON(); // Converte para objeto simples
        return {
            ...trainingJSON,
            participantsCount: trainingJSON.participants ? trainingJSON.participants.length : 0,
        };
    });

    res.status(200).json(trainingsWithParticipantCount);
  } catch (error) {
    console.error('Erro ao listar treinos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar os treinos.', error: error.message });
  }
};
// @desc    Obter detalhes de um treino específico
// @route   GET /api/trainings/:id
// @access  Público/Utilizadores autenticados
const getTrainingById = async (req, res) => {
  const { id } = req.params;
  try {
    const training = await db.Training.findByPk(id, {
      include: [
        {
          model: db.Staff,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
        {
          model: db.User,
          as: 'participants',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }
    
    const trainingJSON = training.toJSON();
    const response = {
        ...trainingJSON,
        participantsCount: trainingJSON.participants ? trainingJSON.participants.length : 0,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao obter detalhes do treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter detalhes do treino.', error: error.message });
  }
};

// @desc    Atualizar um treino
// @route   PUT /api/trainings/:id
// @access  Privado (Admin Staff)
const updateTraining = async (req, res) => {
  const { id } = req.params;
  const { name, description, date, time, capacity, instructorId } = req.body;

  try {
    const training = await db.Training.findByPk(id);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    // Atualizar campos se fornecidos
    if (name) training.name = name;
    if (description) training.description = description;
    if (date) training.date = date;
    if (time) training.time = time;
    if (capacity) {
        if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
            return res.status(400).json({ message: 'A capacidade deve ser um número positivo.' });
        }
        training.capacity = parseInt(capacity);
    }
    if (instructorId) {
        if (isNaN(parseInt(instructorId))) {
            return res.status(400).json({ message: 'O ID do instrutor deve ser um número.' });
        }
        const instructor = await db.Staff.findByPk(parseInt(instructorId));
        if (!instructor) {
            return res.status(404).json({ message: 'Instrutor não encontrado para atualização.' });
        }
        if (!['trainer', 'admin'].includes(instructor.role)) {
            return res.status(400).json({ message: 'O ID fornecido não pertence a um instrutor ou administrador válido.' });
        }
        training.instructorId = parseInt(instructorId);
    }

    await training.save();
    res.status(200).json(training);
  } catch (error) {
    console.error('Erro ao atualizar treino:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar o treino.', error: error.message });
  }
};

// @desc    Eliminar um treino
// @route   DELETE /api/trainings/:id
// @access  Privado (Admin Staff)
const deleteTraining = async (req, res) => {
  const { id } = req.params;
  try {
    const training = await db.Training.findByPk(id);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    // O Sequelize trata da eliminação em cascata das associações na tabela UserTrainings
    // se configurado corretamente (onDelete: 'CASCADE'), ou podemos remover manualmente.
    // Por defeito, as associações belongsToMany não têm onDelete: 'CASCADE' automaticamente.
    // Vamos remover as associações manualmente para garantir.
    await training.setParticipants([]); // Remove todas as associações com User

    await training.destroy();
    res.status(200).json({ message: 'Treino eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro ao eliminar treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar o treino.', error: error.message });
  }
};

// @desc    Cliente (User) inscreve-se num treino
// @route   POST /api/trainings/:id/book
// @access  Privado (Cliente)
const bookTraining = async (req, res) => {
  const trainingId = req.params.id;
  const userId = req.user.id; // Assumindo que o middleware 'protect' e 'isClientUser' já executaram

  try {
    const training = await db.Training.findByPk(trainingId, {
        include: [{ model: db.User, as: 'participants' }]
    });
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      // Segurança extra, middleware já deve ter validado
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    // Verificar se o utilizador já está inscrito
    const isAlreadyBooked = await training.hasParticipant(user); // 'hasParticipant' é um dos métodos mágicos do Sequelize
    if (isAlreadyBooked) {
      return res.status(400).json({ message: 'Já estás inscrito neste treino.' });
    }

    // Verificar capacidade do treino
    const participantsCount = training.participants ? training.participants.length : 0;
    if (participantsCount >= training.capacity) {
      return res.status(400).json({ message: 'Este treino já atingiu a capacidade máxima.' });
    }

    // Adicionar o utilizador aos participantes do treino
    await training.addParticipant(user); // 'addParticipant' é outro método mágico

    // Notificar o cliente
    _internalCreateNotification({
      recipientUserId: userId,
      message: `Inscrição confirmada no treino "${training.name}" para ${format(new Date(training.date), 'dd/MM/yyyy')} às ${training.time.substring(0,5)}.`,
      type: 'TRAINING_BOOKING_CONFIRMED_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/meus-treinos` // ou /calendario ou /treinos/:id/plano
    });

    // Notificar o instrutor do treino (e/ou admins)
    if (training.instructorId) {
      _internalCreateNotification({
        recipientStaffId: training.instructorId,
        message: `Nova inscrição no seu treino "${training.name}" (${format(new Date(training.date), 'dd/MM/yyyy')}): ${user.firstName} ${user.lastName}. Vagas restantes: ${training.capacity - (training.participants.length + 1)}.`,
        type: 'NEW_TRAINING_SIGNUP_STAFF',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/admin/calendario-geral` // Ou um link para gerir o treino
      });
    }

    res.status(200).json({ message: 'Inscrição no treino realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao inscrever no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao inscrever no treino.', error: error.message });
  }
};

// @desc    Cliente (User) cancela a inscrição num treino
// @route   DELETE /api/trainings/:id/book
// @access  Privado (Cliente)
const cancelTrainingBooking = async (req, res) => {
  const trainingId = req.params.id;
  const userId = req.user.id;

  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    // Verificar se o utilizador está realmente inscrito
    const isBooked = await training.hasParticipant(user);
    if (!isBooked) {
      return res.status(400).json({ message: 'Não estás inscrito neste treino.' });
    }

    // Remover o utilizador dos participantes do treino
    await training.removeParticipant(user); // 'removeParticipant'

    // Notificar o cliente
    _internalCreateNotification({
      recipientUserId: userId,
      message: `A sua inscrição no treino "${training.name}" de ${format(new Date(training.date), 'dd/MM/yyyy')} foi cancelada.`,
      type: 'TRAINING_BOOKING_CANCELLED_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/calendario`
    });

    // Opcional: Notificar o instrutor/admin sobre o cancelamento e vaga aberta
    if (training.instructorId) {
        const currentParticipants = await training.countParticipants(); // Recalcula após remoção
         _internalCreateNotification({
            recipientStaffId: training.instructorId,
            message: `Inscrição cancelada no treino "${training.name}" (${format(new Date(training.date), 'dd/MM/yyyy')}) por ${user.firstName} ${user.lastName}. Vagas: ${training.capacity - currentParticipants}.`,
            type: 'TRAINING_SIGNUP_CANCELLED_STAFF',
            relatedResourceId: training.id,
            relatedResourceType: 'training',
            link: `/admin/calendario-geral`
        });
    }

    res.status(200).json({ message: 'Inscrição no treino cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar inscrição.', error: error.message });
  }
};

// @desc    Admin obtém o número de inscrições em treinos na semana atual
// @route   GET /api/trainings/stats/current-week-signups
// @access  Privado (Admin Staff)
const getCurrentWeekSignups = async (req, res) => {
  try {
    const today = new Date();
    // Considera a semana começando na Segunda-feira (weekStartsOn: 1)
    const startDate = startOfWeek(today, { weekStartsOn: 1 });
    const endDate = endOfWeek(today, { weekStartsOn: 1 });

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    const trainingsThisWeek = await db.Training.findAll({
      attributes: ['id'],
      where: {
        date: {
          [Op.gte]: formattedStartDate,
          [Op.lte]: formattedEndDate,
        },
      },
    });

    if (trainingsThisWeek.length === 0) {
      return res.status(200).json({ currentWeekSignups: 0 });
    }

    const trainingIdsThisWeek = trainingsThisWeek.map(t => t.id);
    const signupCount = await db.sequelize.models.UserTrainings.count({
      where: {
        trainingId: {
          [Op.in]: trainingIdsThisWeek,
        },
      },
    });

    res.status(200).json({ currentWeekSignups: signupCount || 0 });
  } catch (error) {
    console.error('Erro ao obter contagem de inscrições da semana:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin obtém o número de treinos agendados para hoje
// @route   GET /api/trainings/stats/today-count
// @access  Privado (Admin Staff)
const getTodayTrainingsCount = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const count = await db.Training.count({
      where: {
        date: today,
      },
    });
    res.status(200).json({ todayTrainingsCount: count || 0 });
  } catch (error) {
    console.error('Erro ao obter contagem de treinos de hoje:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

module.exports = {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
  bookTraining,
  cancelTrainingBooking,
  getCurrentWeekSignups,
  getTodayTrainingsCount,
};
