// backend/controllers/trainingController.js
const { Op } = require('sequelize'); // Para operadores como "greater than or equal"
const db = require('../models');

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

    res.status(200).json({ message: 'Inscrição no treino cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar inscrição.', error: error.message });
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
};
