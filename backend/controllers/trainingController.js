// backend/controllers/trainingController.js
const sequelize = require('sequelize');
const { Op } = sequelize; // Para operadores como "greater than or equal"
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
    const { instructorId, dateFrom, dateTo, nameSearch } = req.query;
    const whereClause = {};

    // VALIDAÇÃO E APLICAÇÃO DOS FILTROS
    if (instructorId) {
      const parsedInstructorId = parseInt(instructorId, 10);
      if (!isNaN(parsedInstructorId)) { // Só aplica o filtro se for um número válido
        whereClause.instructorId = parsedInstructorId;
      } else if (instructorId !== '') { // Se não for vazio e não for número, pode ser um erro de input
        console.warn(`getAllTrainings: instructorId inválido recebido: ${instructorId}`);
        // Poderia retornar um erro 400 aqui se quisesse ser mais estrito
      }
      // Se instructorId for uma string vazia, não adicionamos ao whereClause,
      // o que significa "todos os instrutores"
    }

    if (dateFrom && dateTo) {
      // Adicionar validação de formato de data se necessário (ex: com date-fns isValid)
      whereClause.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      whereClause.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      whereClause.date = { [Op.lte]: dateTo };
    }

    if (nameSearch && typeof nameSearch === 'string' && nameSearch.trim() !== '') {
      whereClause.name = { [Op.iLike]: `%${nameSearch.trim()}%` }; // Usar iLike para case-insensitive (PostgreSQL)
                                                              // Para SQLite, Op.like é case-insensitive por padrão
    }

    console.log('Aplicando filtros para treinos:', whereClause); // Log para depuração

    const trainings = await db.Training.findAll({
      where: whereClause,
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
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    const trainingsWithParticipantCount = trainings.map(training => {
        const trainingJSON = training.toJSON();
        return {
            ...trainingJSON,
            participantsCount: trainingJSON.participants ? trainingJSON.participants.length : 0,
        };
    });

    res.status(200).json(trainingsWithParticipantCount);
  } catch (error) {
    console.error('Erro detalhado ao listar treinos:', error); // Log mais detalhado do erro
    res.status(500).json({ message: 'Erro interno do servidor ao listar os treinos.', errorDetails: error.message });
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
  const userId = req.user.id;

  try {
    const training = await db.Training.findByPk(trainingId, {
        include: [{ model: db.User, as: 'participants' }]
    });
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const isAlreadyBooked = await training.hasParticipant(user);
    if (isAlreadyBooked) {
      return res.status(400).json({ message: 'Já estás inscrito neste treino.' });
    }

    const participantsCount = training.participants ? training.participants.length : 0;
    if (participantsCount >= training.capacity) {
      // TREINO CHEIO - LÓGICA DA LISTA DE ESPERA
      const alreadyOnWaitlist = await db.TrainingWaitlist.findOne({
        where: { trainingId: training.id, userId: user.id, status: 'PENDING' }
      });

      if (alreadyOnWaitlist) {
        return res.status(400).json({ message: 'Treino cheio. Já estás na lista de espera.' });
      }

      await db.TrainingWaitlist.create({
        trainingId: training.id,
        userId: user.id,
        status: 'PENDING'
        // addedAt será gerado automaticamente (createdAt)
      });

      _internalCreateNotification({
        recipientUserId: userId,
        message: `O treino "${training.name}" está cheio. Foste adicionado à lista de espera. Serás notificado se surgir uma vaga.`,
        type: 'TRAINING_WAITLIST_ADDED_CLIENT',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/calendario`
      });

      return res.status(202).json({ // 202 Accepted pode ser mais apropriado aqui
        message: 'Treino cheio. Foste adicionado à lista de espera.'
      });
    }

    await training.addParticipant(user);

    _internalCreateNotification({ /* ... (notificação de sucesso como estava) ... */ });
    if (training.instructorId) {
      _internalCreateNotification({ /* ... (notificação para instrutor como estava) ... */ });
    }

    res.status(200).json({ message: 'Inscrição no treino realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao inscrever no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao inscrever no treino.', errorDetails: error.message });
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
    if (!training) { /* ... (como estava) ... */ }
    const user = await db.User.findByPk(userId);
    if (!user) { /* ... (como estava) ... */ }
    const isBooked = await training.hasParticipant(user);
    if (!isBooked) { /* ... (como estava) ... */ }

    await training.removeParticipant(user);
    _internalCreateNotification({ /* ... (notificação de cancelamento para cliente como estava) ... */ });

    // LÓGICA DA LISTA DE ESPERA: Vaga abriu
    const waitlistEntries = await db.TrainingWaitlist.findAll({
      where: { trainingId: training.id, status: 'PENDING' },
      order: [['createdAt', 'ASC']], // Mais antigo primeiro
      include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'email'] }]
    });

    if (waitlistEntries.length > 0) {
      const firstInWaitlist = waitlistEntries[0];

      // Opção: Notificar o primeiro da lista
      _internalCreateNotification({
        recipientUserId: firstInWaitlist.userId,
        message: `Boas notícias! Abriu uma vaga no treino "<span class="math-inline">\{training\.name\}" \(</span>{format(new Date(training.date), 'dd/MM/yyyy')}) para o qual estavas na lista de espera. Inscreve-te já!`,
        type: 'TRAINING_SPOT_AVAILABLE_CLIENT',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/calendario` // ou link direto para o treino
      });
      // Mudar status na lista de espera (opcional)
      // firstInWaitlist.status = 'NOTIFIED';
      // firstInWaitlist.notifiedAt = new Date();
      // await firstInWaitlist.save();

      // Notificar Admin/Instrutor
      _internalCreateNotification({
        recipientStaffId: training.instructorId, // Ou um adminId fixo
        message: `Uma vaga abriu no treino "${training.name}". ${firstInWaitlist.user.firstName} (primeiro na lista de espera) foi notificado.`,
        type: 'TRAINING_SPOT_OPENED_STAFF_WAITLIST',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/admin/trainings/${training.id}/manage-waitlist` // Futura página de gestão da lista de espera
      });
    } else if (training.instructorId) { // Se não há lista de espera, mas notifica o instrutor sobre a vaga.
        const currentParticipants = await training.countParticipants();
        _internalCreateNotification({ /* ... (notificação de vaga aberta para instrutor como estava) ... */ });
    }

    res.status(200).json({ message: 'Inscrição no treino cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar inscrição.', errorDetails: error.message });
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

// @desc    Admin inscreve um cliente específico num treino
// @route   POST /trainings/:trainingId/admin-book-client
// @access  Privado (Admin Staff)
const adminBookClientForTraining = async (req, res) => {
  const { trainingId } = req.params;
  const { userId } = req.body; // userId do cliente a ser inscrito

  if (!userId) {
    return res.status(400).json({ message: 'ID do Utilizador (cliente) é obrigatório.' });
  }

  try {
    const training = await db.Training.findByPk(trainingId, {
      include: [{ model: db.User, as: 'participants' }]
    });
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    const userToBook = await db.User.findByPk(userId);
    if (!userToBook) {
      return res.status(404).json({ message: 'Utilizador (cliente) a ser inscrito não encontrado.' });
    }
    if (userToBook.isAdmin) { // Assumindo que User.isAdmin distingue clientes de staff/admins
        return res.status(400).json({ message: 'Não é possível inscrever um administrador ou membro da equipa como participante através desta função.' });
    }


    const isAlreadyBooked = await training.hasParticipant(userToBook);
    if (isAlreadyBooked) {
      return res.status(400).json({ message: `O cliente ${userToBook.firstName} já está inscrito neste treino.` });
    }

    const participantsCount = training.participants ? training.participants.length : 0;
    if (participantsCount >= training.capacity) {
      return res.status(400).json({ message: 'Este treino já atingiu a capacidade máxima.' });
    }

    await training.addParticipant(userToBook);

    // Notificar o cliente (opcional, mas bom)
    _internalCreateNotification({
      recipientUserId: userToBook.id,
      message: `Foi inscrito no treino "${training.name}" (${format(new Date(training.date), 'dd/MM/yyyy')}) por um administrador.`,
      type: 'TRAINING_BOOKED_BY_ADMIN_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/calendario`
    });

    // Notificar o instrutor (opcional, se diferente do admin que fez a ação)
    if (training.instructorId && training.instructorId !== req.staff.id) {
         _internalCreateNotification({
            recipientStaffId: training.instructorId,
            message: `Cliente ${userToBook.firstName} ${userToBook.lastName} foi inscrito no seu treino "${training.name}" por um admin. Vagas: ${training.capacity - (participantsCount + 1)}.`,
            type: 'CLIENT_BOOKED_BY_ADMIN_STAFF',
            relatedResourceId: training.id,
            relatedResourceType: 'training',
            link: `/admin/calendario-geral`
        });
    }

    // Retornar o treino atualizado com a lista de participantes
    const updatedTraining = await db.Training.findByPk(trainingId, {
        include: [{ model: db.User, as: 'participants', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    const trainingJSON = updatedTraining.toJSON();
    const response = {
        ...trainingJSON,
        participantsCount: trainingJSON.participants ? trainingJSON.participants.length : 0,
    };

    res.status(200).json({ message: `Cliente ${userToBook.firstName} inscrito com sucesso!`, training: response });

  } catch (error) {
    console.error('Erro (admin) ao inscrever cliente no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin cancela a inscrição de um cliente específico num treino
// @route   DELETE /trainings/:trainingId/admin-cancel-booking/:userId
// @access  Privado (Admin Staff)
const adminCancelClientBooking = async (req, res) => {
    const { trainingId, userId: userIdToCancel } = req.params; // userId aqui é o do cliente a ser cancelado

    try {
        const training = await db.Training.findByPk(trainingId);
        if (!training) { /* ... (como estava) ... */ }
        const userToCancel = await db.User.findByPk(userIdToCancel);
        if (!userToCancel) { /* ... (como estava) ... */ }
        const isBooked = await training.hasParticipant(userToCancel);
        if (!isBooked) { /* ... (como estava) ... */ }

        await training.removeParticipant(userToCancel);
        _internalCreateNotification({ /* ... (notificação de cancelamento para cliente como estava) ... */ });

        // LÓGICA DA LISTA DE ESPERA (similar à de clientCancelTrainingBooking)
        const waitlistEntries = await db.TrainingWaitlist.findAll({
            where: { trainingId: training.id, status: 'PENDING' },
            order: [['createdAt', 'ASC']],
            include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'email'] }]
        });

        if (waitlistEntries.length > 0) {
            const firstInWaitlist = waitlistEntries[0];
            _internalCreateNotification({
                recipientUserId: firstInWaitlist.userId,
                message: `Boas notícias! Abriu uma vaga no treino "<span class="math-inline">\{training\.name\}" \(</span>{format(new Date(training.date), 'dd/MM/yyyy')}) para o qual estavas na lista de espera. Um admin tratou disto. Inscreve-te já!`,
                type: 'TRAINING_SPOT_AVAILABLE_CLIENT',
                relatedResourceId: training.id,
                relatedResourceType: 'training',
                link: `/calendario`
            });
            // Notificar Admin/Instrutor que despoletou o cancelamento (ou outro admin/instrutor)
            if (training.instructorId) { // Pode querer notificar o instrutor do treino
                 _internalCreateNotification({
                    recipientStaffId: training.instructorId,
                    message: `Uma vaga abriu no treino "${training.name}" após cancelamento de ${userToCancel.firstName}. ${firstInWaitlist.user.firstName} (lista de espera) foi notificado.`,
                    type: 'TRAINING_SPOT_OPENED_STAFF_WAITLIST',
                    relatedResourceId: training.id,
                    relatedResourceType: 'training',
                    link: `/admin/trainings/${training.id}/manage-waitlist`
                });
            }
        } else if (training.instructorId && training.instructorId !== req.staff.id) {
             const currentParticipants = await training.countParticipants();
             _internalCreateNotification({ /* ... (notificação de vaga aberta para instrutor como estava) ... */ });
        }

        const updatedTraining = await db.Training.findByPk(trainingId, { /* ... (include como estava) ... */ });
        // ... (resto da resposta como estava)
        res.status(200).json({ message: `Inscrição do cliente ${userToCancel.firstName} cancelada com sucesso!`, training: updatedTraining.toJSON() });

    } catch (error) {
        console.error('Erro (admin) ao cancelar inscrição do cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
    }
};

// @desc    Admin obtém a lista de espera para um treino específico
// @route   GET /api/trainings/:trainingId/waitlist
// @access  Privado (Admin Staff)
const adminGetTrainingWaitlist = async (req, res) => {
  const { trainingId } = req.params;
  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) {
      return res.status(404).json({ message: "Treino não encontrado." });
    }

    const waitlistEntries = await db.TrainingWaitlist.findAll({
      where: { trainingId: training.id, status: 'PENDING' }, // Mostrar apenas os pendentes
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'ASC']], // Mais antigo primeiro
    });
    res.status(200).json(waitlistEntries);
  } catch (error) {
    console.error(`Erro ao buscar lista de espera para treino ID ${trainingId}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// @desc    Admin promove um cliente da lista de espera para o treino
// @route   POST /api/trainings/:trainingId/waitlist/promote
// @access  Privado (Admin Staff)
const adminPromoteFromWaitlist = async (req, res) => {
  const { trainingId } = req.params;
  const { userId, waitlistEntryId } = req.body; // Admin envia o userId do cliente a promover
                                            // ou o ID da entrada na lista de espera

  if (!userId && !waitlistEntryId) {
    return res.status(400).json({ message: "ID do utilizador ou ID da entrada na lista de espera é obrigatório." });
  }

  try {
    const training = await db.Training.findByPk(trainingId, {
      include: [{ model: db.User, as: 'participants' }]
    });
    if (!training) {
      return res.status(404).json({ message: "Treino não encontrado." });
    }

    const participantsCount = training.participants ? training.participants.length : 0;
    if (participantsCount >= training.capacity) {
      return res.status(400).json({ message: "Treino já está na capacidade máxima. Cancele uma inscrição primeiro." });
    }

    let waitlistEntry;
    if (waitlistEntryId) {
        waitlistEntry = await db.TrainingWaitlist.findByPk(waitlistEntryId);
    } else { // userId foi fornecido
        waitlistEntry = await db.TrainingWaitlist.findOne({
            where: { trainingId: training.id, userId: userId, status: 'PENDING' }
        });
    }

    if (!waitlistEntry || waitlistEntry.trainingId !== training.id) {
      return res.status(404).json({ message: "Entrada na lista de espera não encontrada para este treino e utilizador, ou não está pendente." });
    }

    const userToPromote = await db.User.findByPk(waitlistEntry.userId);
    if (!userToPromote) {
        // Isto não deveria acontecer se a entrada na lista de espera for válida
        await waitlistEntry.destroy(); // Limpar entrada órfã
        return res.status(404).json({ message: "Utilizador da lista de espera não encontrado."});
    }

    // Adicionar ao treino
    await training.addParticipant(userToPromote);
    // Mudar status ou remover da lista de espera
    waitlistEntry.status = 'BOOKED'; // Ou await waitlistEntry.destroy();
    await waitlistEntry.save();

    _internalCreateNotification({
      recipientUserId: userToPromote.id,
      message: `Boas notícias! Foste promovido da lista de espera e estás agora inscrito no treino "<span class="math-inline">\{training\.name\}" \(</span>{format(new Date(training.date), 'dd/MM/yyyy')}).`,
      type: 'TRAINING_PROMOTED_FROM_WAITLIST_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/calendario`
    });
    _internalCreateNotification({
      recipientStaffId: req.staff.id, // Notificar o admin que fez a ação
      message: `Promoveste <span class="math-inline">\{userToPromote\.firstName\} da lista de espera para o treino "</span>{training.name}".`,
      type: 'ADMIN_PROMOTED_FROM_WAITLIST_STAFF',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/admin/trainings/${training.id}/manage-waitlist`
    });


    res.status(200).json({ message: `Cliente ${userToPromote.firstName} promovido da lista de espera com sucesso!`});

  } catch (error) {
    console.error('Erro ao promover cliente da lista de espera:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

export const adminGetCurrentWeekSignups = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/stats/current-week-signups`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar inscrições da semana.');
    return data;
  } catch (error) { console.error("Erro em adminGetCurrentWeekSignups:", error); throw error; }
};

export const adminGetTodayTrainingsCount = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/stats/today-count`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar contagem de treinos de hoje.');
    return data;
  } catch (error) { console.error("Erro em adminGetTodayTrainingsCount:", error); throw error; }
};

export const adminBookClientForTrainingService = async (trainingId, userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId || !userId) throw new Error('ID do Treino e ID do Utilizador são obrigatórios.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/admin-book-client`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: userId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao inscrever cliente no treino.');
    return data;
  } catch (error) {
    console.error("Erro em adminBookClientForTrainingService:", error);
    throw error;
  }
};

export const adminCancelClientBookingService = async (trainingId, userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId || !userId) throw new Error('ID do Treino e ID do Utilizador são obrigatórios.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/admin-cancel-booking/${userId}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao cancelar inscrição do cliente no treino.');
    return data; 
  } catch (error) {
    console.error("Erro em adminCancelClientBookingService:", error);
    throw error;
  }
};

export const adminGetTrainingWaitlistService = async (trainingId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/waitlist`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar lista de espera do treino.');
    return data; 
  } catch (error) {
    console.error(`Erro em adminGetTrainingWaitlistService para trainingId ${trainingId}:`, error);
    throw error;
  }
};

export const adminPromoteClientFromWaitlistService = async (trainingId, userIdToPromote, token, waitlistEntryId = null) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido.');
  if (!userIdToPromote && !waitlistEntryId) throw new Error('ID do Utilizador ou ID da Entrada na Lista de Espera é obrigatório.');

  const body = {};
  if (userIdToPromote) body.userId = userIdToPromote;
  if (waitlistEntryId) body.waitlistEntryId = waitlistEntryId;

  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/waitlist/promote`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao promover cliente da lista de espera.');
    return data;
  } catch (error) {
    console.error(`Erro em adminPromoteClientFromWaitlistService para trainingId ${trainingId}:`, error);
    throw error;
  }
};


// --- NOVA FUNÇÃO PARA CLIENTE SE INSCREVER DE FORMA RECORRENTE ---
/**
 * Cliente inscreve-se de forma recorrente num treino mestre.
 * @param {number} masterTrainingId - ID do treino mestre.
 * @param {string} clientSubscriptionEndDate - Data até quando o cliente quer a subscrição.
 * @param {string} token - Token do cliente.
 * @returns {Promise<object>} - Resposta da API.
 */
export const subscribeToRecurringTrainingService = async (masterTrainingId, clientSubscriptionEndDate, token) => {
  if (!token) throw new Error('Token não fornecido para subscrição recorrente.');
  if (!masterTrainingId || !clientSubscriptionEndDate) {
    throw new Error('ID do treino mestre e data de fim da subscrição são obrigatórios.');
  }
  
  // O endpoint no backend é POST /trainings/:masterTrainingId/subscribe-recurring
  const url = `${API_URL}/trainings/${masterTrainingId}/subscribe-recurring`; 

  console.log('Frontend Service: Subscrevendo recorrente. URL:', url, 'Payload:', { clientSubscriptionEndDate });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ clientSubscriptionEndDate }),
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("Falha ao fazer parse da resposta JSON de subscribeToRecurringTrainingService:", e);
    console.error("Resposta recebida (texto):", responseText);
    throw new Error(`Resposta do servidor para subscrição recorrente não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
  }

  if (!response.ok) {
    console.error('Erro na resposta de subscribeToRecurringTrainingService (status não OK):', data);
    throw new Error(data.message || `Erro ao processar inscrição recorrente. Status: ${response.status}`);
  }
  return data; // Espera-se { message }
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
  adminBookClientForTraining,
  adminCancelClientBooking,
  adminGetTrainingWaitlist,
  adminPromoteFromWaitlist,
  subscribeToRecurringTrainingService,
  adminGetTrainingWaitlistService,
  adminCancelClientBookingService,
  adminBookClientForTrainingService,
  adminGetTodayTrainingsCount,
  adminGetCurrentWeekSignups
};
