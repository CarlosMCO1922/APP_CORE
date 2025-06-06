// backend/controllers/trainingController.js
const { Op } = require('sequelize'); 
const db = require('../models');
const { startOfWeek, endOfWeek, format } = require('date-fns');
const { _internalCreateNotification } = require('./notificationController');


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
        link: `/calendario` 
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


const getAllTrainings = async (req, res) => {
  try {
    const { instructorId, dateFrom, dateTo, nameSearch } = req.query;
    const whereClause = {};

    if (instructorId) {
      const parsedInstructorId = parseInt(instructorId, 10);
      if (!isNaN(parsedInstructorId)) { // Só aplica o filtro se for um número válido
        whereClause.instructorId = parsedInstructorId;
      } else if (instructorId !== '') { // Se não for vazio e não for número, pode ser um erro de input
        console.warn(`getAllTrainings: instructorId inválido recebido: ${instructorId}`);
       
      }
      
    }

    if (dateFrom && dateTo) {
      whereClause.date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      whereClause.date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      whereClause.date = { [Op.lte]: dateTo };
    }

    if (nameSearch && typeof nameSearch === 'string' && nameSearch.trim() !== '') {
      whereClause.name = { [Op.iLike]: `%${nameSearch.trim()}%` }; 
    }

    console.log('Aplicando filtros para treinos:', whereClause); 

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
        {
          model: db.TrainingSeries,
          as: 'series', 
          attributes: ['id', 'name', 'seriesStartDate', 'seriesEndDate', 'dayOfWeek', 'startTime', 'endTime', 'recurrenceType'] // Campos que podem ser úteis
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
    console.error('Erro detalhado ao listar treinos:', error); 
    res.status(500).json({ message: 'Erro interno do servidor ao listar os treinos.', errorDetails: error.message });
  }
};


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


const updateTraining = async (req, res) => {
  const { id } = req.params;
  const { name, description, date, time, capacity, instructorId } = req.body;

  try {
    const training = await db.Training.findByPk(id);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    
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


const deleteTraining = async (req, res) => {
  const { id } = req.params;
  try {
    const training = await db.Training.findByPk(id);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    
    await training.setParticipants([]); 

    await training.destroy();
    res.status(200).json({ message: 'Treino eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro ao eliminar treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar o treino.', error: error.message });
  }
};


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
      });

      _internalCreateNotification({
        recipientUserId: userId,
        message: `O treino "${training.name}" está cheio. Foste adicionado à lista de espera. Serás notificado se surgir uma vaga.`,
        type: 'TRAINING_WAITLIST_ADDED_CLIENT',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/calendario`
      });

      return res.status(202).json({ 
        message: 'Treino cheio. Foste adicionado à lista de espera.'
      });
    }

    await training.addParticipant(user);

    _internalCreateNotification({ recipientUserId: userId,
      message: `Inscrição no treino "${training.name}" realizada com sucesso!`,
      type: 'TRAINING_BOOKING_SUCCESS',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/calendario` });
    if (training.instructorId) {
      _internalCreateNotification({ recipientStaffId: training.instructorId,
        message: `${user.firstName} ${user.lastName} inscreveu-se no seu treino "${training.name}".`,
        type: 'TRAINING_NEW_PARTICIPANT',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/admin/calendario-geral` });
    }

    res.status(200).json({ message: 'Inscrição no treino realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao inscrever no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao inscrever no treino.', errorDetails: error.message });
  }
};

const cancelTrainingBooking = async (req, res) => {
  const trainingId = req.params.id;
  const userId = req.user.id;

  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) { return res.status(404).json({ message: 'Treino não encontrado.' }); }
    const user = await db.User.findByPk(userId);
    if (!user) { return res.status(404).json({ message: 'Utilizador não encontrado.' }); }
    const isBooked = await training.hasParticipant(user);
    if (!isBooked) { return res.status(400).json({ message: 'Não estás inscrito neste treino.' }); }

    await training.removeParticipant(user);
    _internalCreateNotification({  recipientUserId: userId,
      message: `A sua inscrição no treino "${training.name}" foi cancelada.`,
      type: 'TRAINING_CANCELLED_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: '/calendario' });

    // LÓGICA DA LISTA DE ESPERA
    const waitlistEntries = await db.TrainingWaitlist.findAll({
      where: { trainingId: training.id, status: 'PENDING' },
      order: [['createdAt', 'ASC']], 
      include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'email'] }]
    });

    if (waitlistEntries.length > 0) {
      const firstInWaitlist = waitlistEntries[0];

      _internalCreateNotification({
        recipientUserId: firstInWaitlist.userId,
        message: `Boas notícias! Abriu uma vaga no treino "<span class="math-inline">\{training\.name\}" \(</span>{format(new Date(training.date), 'dd/MM/yyyy')}) para o qual estavas na lista de espera. Inscreve-te já!`,
        type: 'TRAINING_SPOT_AVAILABLE_CLIENT',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/calendario` 
      });

      // Notificar Admin/Instrutor
      _internalCreateNotification({
        recipientStaffId: training.instructorId, 
        message: `Uma vaga abriu no treino "${training.name}". ${firstInWaitlist.user.firstName} (primeiro na lista de espera) foi notificado.`,
        type: 'TRAINING_SPOT_OPENED_STAFF_WAITLIST',
        relatedResourceId: training.id,
        relatedResourceType: 'training',
        link: `/admin/trainings/${training.id}/manage-waitlist` 
      });
    } else if (training.instructorId) { 
        const currentParticipants = await training.countParticipants();
        _internalCreateNotification({ recipientStaffId: training.instructorId,
            message: `Uma vaga abriu no seu treino "${training.name}". Vagas restantes: ${training.capacity - currentParticipants}.`,
            type: 'TRAINING_SPOT_OPENED_STAFF',
            relatedResourceId: training.id,
            relatedResourceType: 'training',
            link: `/admin/calendario-geral` });
    }

    res.status(200).json({ message: 'Inscrição no treino cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição no treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar inscrição.', errorDetails: error.message });
  }
};


const getCurrentWeekSignups = async (req, res) => {
  try {
    const today = new Date();
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


const adminBookClientForTraining = async (req, res) => {
  const { trainingId } = req.params;
  const { userId } = req.body; 

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
    if (userToBook.isAdmin) { 
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

    // Notificar o cliente 
    _internalCreateNotification({
      recipientUserId: userToBook.id,
      message: `Foi inscrito no treino "${training.name}" (${format(new Date(training.date), 'dd/MM/yyyy')}) por um administrador.`,
      type: 'TRAINING_BOOKED_BY_ADMIN_CLIENT',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: `/calendario`
    });

    // Notificar o instrutor 
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


const adminCancelClientBooking = async (req, res) => {
    const { trainingId, userId: userIdToCancel } = req.params; 

    try {
        const training = await db.Training.findByPk(trainingId);
        if (!training) { return res.status(404).json({ message: 'Treino não encontrado.' }); }
        const userToCancel = await db.User.findByPk(userIdToCancel);
        if (!userToCancel) { return res.status(404).json({ message: 'Utilizador a cancelar não encontrado.' }); }
        const isBooked = await training.hasParticipant(userToCancel);
        if (!isBooked) { return res.status(400).json({ message: `O cliente ${userToCancel.firstName} não está inscrito neste treino.` });}

        await training.removeParticipant(userToCancel);
        _internalCreateNotification({ recipientUserId: userToCancel.id,
            message: `A sua inscrição no treino "${training.name}" foi cancelada por um administrador.`,
            type: 'TRAINING_CANCELLED_BY_ADMIN_CLIENT',
            relatedResourceId: training.id,
            relatedResourceType: 'training',
            link: `/calendario` });

        // LÓGICA DA LISTA DE ESPERA 
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
            if (training.instructorId) { 
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
             _internalCreateNotification({ recipientStaffId: training.instructorId,
                message: `Uma vaga abriu no seu treino "${training.name}" após um cancelamento. Vagas restantes: ${training.capacity - currentParticipants}.`,
                type: 'TRAINING_SPOT_OPENED_STAFF',
                relatedResourceId: training.id,
                relatedResourceType: 'training',
                link: `/admin/calendario-geral` });
        }

        const updatedTraining = await db.Training.findByPk(trainingId, { include: [{ model: db.User, as: 'participants', attributes: ['id', 'firstName', 'lastName', 'email'] }] });
        const trainingJSON = updatedTraining.toJSON();
        const response = { ...trainingJSON, participantsCount: trainingJSON.participants.length };
        res.status(200).json({ message: `Inscrição do cliente ${userToCancel.firstName} cancelada com sucesso!`, training: updatedTraining.toJSON() });

    } catch (error) {
        console.error('Erro (admin) ao cancelar inscrição do cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
    }
};


const adminGetTrainingWaitlist = async (req, res) => {
  const { trainingId } = req.params;
  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) {
      return res.status(404).json({ message: "Treino não encontrado." });
    }

    const waitlistEntries = await db.TrainingWaitlist.findAll({
      where: { trainingId: training.id, status: 'PENDING' }, 
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'ASC']], 
    });
    res.status(200).json(waitlistEntries);
  } catch (error) {
    console.error(`Erro ao buscar lista de espera para treino ID ${trainingId}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};


const adminPromoteFromWaitlist = async (req, res) => {
  const { trainingId } = req.params;
  const { userId, waitlistEntryId } = req.body; 
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
    } else { 
        waitlistEntry = await db.TrainingWaitlist.findOne({
            where: { trainingId: training.id, userId: userId, status: 'PENDING' }
        });
    }

    if (!waitlistEntry || waitlistEntry.trainingId !== training.id) {
      return res.status(404).json({ message: "Entrada na lista de espera não encontrada para este treino e utilizador, ou não está pendente." });
    }

    const userToPromote = await db.User.findByPk(waitlistEntry.userId);
    if (!userToPromote) {
        await waitlistEntry.destroy(); 
        return res.status(404).json({ message: "Utilizador da lista de espera não encontrado."});
    }

    // Adicionar ao treino
    await training.addParticipant(userToPromote);
    waitlistEntry.status = 'BOOKED'; 
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
      recipientStaffId: req.staff.id, 
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

const adminGetCurrentWeekSignups = async (token) => {
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

const adminGetTodayTrainingsCount = async (token) => {
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

const adminBookClientForTrainingService = async (trainingId, userId, token) => {
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

const adminCancelClientBookingService = async (trainingId, userId, token) => {
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

const adminGetTrainingWaitlistService = async (trainingId, token) => {
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

const adminPromoteClientFromWaitlistService = async (trainingId, userIdToPromote, token, waitlistEntryId = null) => {
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




const subscribeToRecurringTrainingService = async (masterTrainingId, clientSubscriptionEndDate, token) => {
  if (!token) throw new Error('Token não fornecido para subscrição recorrente.');
  if (!masterTrainingId || !clientSubscriptionEndDate) {
    throw new Error('ID do treino mestre e data de fim da subscrição são obrigatórios.');
  }
  
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
  return data;
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
