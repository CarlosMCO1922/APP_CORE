// backend/controllers/trainingController.js
const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment'); // Para manipulação de datas
const { format, startOfWeek, endOfWeek } = require('date-fns');
const { _internalCreateNotification } = require('./notificationController');

// --- Função Auxiliar para Gerar Instâncias Recorrentes ---
const generateRecurringInstances = async (masterTraining, transaction) => {
  if (!masterTraining.isRecurringMaster || !masterTraining.recurrenceType || !masterTraining.recurrenceEndDate) {
    console.log(`[generateRecurringInstances] Treino ID ${masterTraining.id} não é mestre recorrente ou faltam dados de recorrência.`);
    return [];
  }

  const instancesToCreate = [];
  // A data do masterTraining é a primeira instância, já existe.
  // Começamos a gerar a partir da próxima ocorrência teórica.
  let currentDate = moment(masterTraining.date).clone(); 
  const finalRecurrenceEndDate = moment(masterTraining.recurrenceEndDate);

  // Apagar instâncias futuras existentes (EXCETO o próprio mestre se ele for uma instância válida)
  // que não tenham bookings para este mestre, para evitar duplicados ao atualizar.
  // Instâncias com bookings devem ser tratadas com mais cuidado (ex: notificar, não apagar).
  // Por simplicidade inicial, vamos apagar as que ainda não têm bookings.
  const existingInstances = await db.Training.findAll({
    where: {
      parentRecurringTrainingId: masterTraining.id,
      date: { [Op.gt]: masterTraining.date } // Apenas instâncias futuras em relação à data do mestre
    },
    include: [{ model: db.User, as: 'participants', attributes: ['id'] }],
    transaction
  });

  const instancesToDelete = existingInstances.filter(inst => (!inst.participants || inst.participants.length === 0));
  if (instancesToDelete.length > 0) {
    await db.Training.destroy({
      where: {
        id: { [Op.in]: instancesToDelete.map(inst => inst.id) }
      },
      transaction
    });
    console.log(`[generateRecurringInstances] ${instancesToDelete.length} instâncias futuras sem bookings foram apagadas para o mestre ID ${masterTraining.id}.`);
  }
  
  // Determinar a data da próxima instância a ser criada
  if (masterTraining.recurrenceType === 'weekly') {
    currentDate.add(1, 'week');
  } else if (masterTraining.recurrenceType === 'daily') {
    currentDate.add(1, 'day');
  } // Adicionar 'monthly' se necessário

  while (currentDate.isSameOrBefore(finalRecurrenceEndDate)) {
    if (masterTraining.recurrenceType === 'weekly') {
      // Para semanal, a data já avança de semana em semana. O dia da semana é o mesmo do mestre.
      // Se currentDate.day() não for o mesmo que moment(masterTraining.date).day(), algo está errado com a lógica de incremento.
      // No entanto, ao fazer .add(1, 'week'), o dia da semana mantém-se.
    } else if (masterTraining.recurrenceType === 'daily') {
      // Para diário, todas as datas são válidas
    } 
    // Adicionar lógica para 'monthly' se necessário (ex: mesmo dia do mês, ou Xª Y-feira do mês)

    // Só cria se ainda não existir uma instância (seja mestre ou gerada) com esta data e hora para este instrutor
    // Ou se a instância existente que foi mantida (com bookings) não coincide com esta data exata.
    // Esta verificação previne recriar uma instância que foi mantida porque tinha bookings.
    const conflictingInstanceCheck = await db.Training.findOne({
        where: {
            instructorId: masterTraining.instructorId,
            date: currentDate.format('YYYY-MM-DD'),
            time: masterTraining.time,
            // Se a instância for parte de outra série OU um treino único no mesmo horário
            [Op.or]: [
                { parentRecurringTrainingId: { [Op.ne]: masterTraining.id } }, // Não é uma instância DESTE mestre
                { parentRecurringTrainingId: null, isRecurringMaster: false }  // É um treino único
            ]
        },
        transaction
    });
    // E também verificar se esta instância específica (mesmo pai, mesma data) já não existe (caso tenha sido mantida)
    const thisExactInstanceExists = existingInstances.some(inst => 
        moment(inst.date).isSame(currentDate, 'day') && 
        inst.time === masterTraining.time
    );


    if (!conflictingInstanceCheck && !thisExactInstanceExists) {
        instancesToCreate.push({
            name: `${masterTraining.name}`, // Manter o nome do mestre para as instâncias
            description: masterTraining.description,
            date: currentDate.format('YYYY-MM-DD'),
            time: masterTraining.time,
            durationMinutes: masterTraining.durationMinutes,
            capacity: masterTraining.capacity,
            instructorId: masterTraining.instructorId,
            status: 'scheduled',
            isRecurringMaster: false,
            parentRecurringTrainingId: masterTraining.id,
            isGeneratedInstance: true,
            // workoutPlanId: masterTraining.workoutPlanId, // Se tiver
        });
    }

    if (masterTraining.recurrenceType === 'weekly') {
      currentDate.add(1, 'week');
    } else if (masterTraining.recurrenceType === 'daily') {
      currentDate.add(1, 'day');
    }
    // Adicionar incremento para 'monthly'
  }

  if (instancesToCreate.length > 0) {
    const created = await db.Training.bulkCreate(instancesToCreate, { transaction });
    console.log(`[generateRecurringInstances] ${created.length} novas instâncias geradas para o mestre ID ${masterTraining.id}.`);
    return created;
  }
  return [];
};

// @desc    Admin cria um novo treino (pode ser recorrente)
// @route   POST /api/trainings
// @access  Privado (Admin Staff)
exports.createTraining = async (req, res) => {
  const { 
    name, description, date, time, capacity, instructorId, durationMinutes,
    isRecurringMaster, recurrenceType, recurrenceEndDate 
  } = req.body;

  if (!name || !date || !time || capacity === undefined || instructorId === undefined || durationMinutes === undefined) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta (nome, data, hora, capacidade, instrutor, duração).' });
  }
  if (isRecurringMaster && (!recurrenceType || !recurrenceEndDate)) {
    return res.status(400).json({ message: 'Para treinos recorrentes, tipo e data de fim da recorrência são obrigatórios.' });
  }
  if (isRecurringMaster && recurrenceType !== 'weekly') { // POR AGORA SÓ SEMANAL
    return res.status(400).json({ message: 'De momento, apenas recorrência semanal é suportada.' });
  }
  if (isRecurringMaster && moment(recurrenceEndDate).isBefore(date)) {
    return res.status(400).json({ message: 'A data de fim da recorrência não pode ser anterior à data de início do treino mestre.' });
  }


  const transaction = await db.sequelize.transaction();
  try {
    const instructor = await db.Staff.findByPk(parseInt(instructorId), { transaction });
    if (!instructor || !['trainer', 'admin', 'physiotherapist'].includes(instructor.role)) { // Adicionado physiotherapist se puderem ser instrutores
      await transaction.rollback();
      return res.status(400).json({ message: 'Instrutor inválido ou não encontrado.' });
    }

    const masterTraining = await db.Training.create({
      name, description, date, time, 
      durationMinutes: parseInt(durationMinutes),
      capacity: parseInt(capacity), 
      instructorId: parseInt(instructorId),
      isRecurringMaster: !!isRecurringMaster,
      recurrenceType: isRecurringMaster ? recurrenceType : null,
      recurrenceEndDate: isRecurringMaster ? recurrenceEndDate : null,
      parentRecurringTrainingId: null, 
      status: 'scheduled',
      isGeneratedInstance: false, 
    }, { transaction });

    let generatedInstances = [];
    if (masterTraining.isRecurringMaster) {
      generatedInstances = await generateRecurringInstances(masterTraining, transaction);
    }
    
    if (masterTraining.instructorId) {
        _internalCreateNotification({
            recipientStaffId: masterTraining.instructorId,
            message: `Foi-lhe atribuído um novo treino ${masterTraining.isRecurringMaster ? 'recorrente (mestre)' : ''}: "${masterTraining.name}" com início a ${format(new Date(masterTraining.date), 'dd/MM/yyyy')} às ${masterTraining.time.substring(0,5)}.`,
            type: 'NEW_TRAINING_ASSIGNED',
            relatedResourceId: masterTraining.id,
            relatedResourceType: 'training',
            link: `/admin/calendario-geral` 
        });
    }

    await transaction.commit();
    res.status(201).json({ 
        message: `Treino ${masterTraining.isRecurringMaster ? `mestre e ${generatedInstances.length} instâncias recorrentes criados` : 'criado'} com sucesso!`,
        training: masterTraining,
        instancesGeneratedCount: generatedInstances.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar treino:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar o treino.', errorDetails: error.message });
  }
};

// @desc    Admin atualiza um treino
// @route   PUT /api/trainings/:id
// @access  Privado (Admin Staff)
exports.updateTraining = async (req, res) => {
  const trainingId = parseInt(req.params.id, 10);
  const { 
    name, description, date, time, capacity, instructorId, durationMinutes,
    isRecurringMaster, recurrenceType, recurrenceEndDate 
  } = req.body;

  // Validações
  if (isRecurringMaster && (!recurrenceType || !recurrenceEndDate)) {
    return res.status(400).json({ message: 'Para treinos recorrentes, tipo e data de fim da recorrência são obrigatórios.' });
  }
   if (isRecurringMaster && recurrenceType !== 'weekly') { // POR AGORA SÓ SEMANAL
    return res.status(400).json({ message: 'De momento, apenas recorrência semanal é suportada.' });
  }
  if (isRecurringMaster && moment(recurrenceEndDate).isBefore(date)) {
    return res.status(400).json({ message: 'A data de fim da recorrência não pode ser anterior à data de início do treino mestre.' });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const trainingToUpdate = await db.Training.findByPk(trainingId, { transaction });
    if (!trainingToUpdate) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    // Se este treino é uma instância gerada, não permitir alterá-lo para ser um mestre.
    // A alteração de instâncias deve ser feita através do mestre.
    if (trainingToUpdate.parentRecurringTrainingId && isRecurringMaster) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Não pode transformar uma instância gerada num novo treino mestre. Edite o treino mestre original ou crie um novo.' });
    }
    // Se este é uma instância, permitir apenas alterações limitadas (ex: status, notas específicas da instância - não implementado aqui)
    // Por agora, se for instância, não permitir grandes alterações.
    if (trainingToUpdate.parentRecurringTrainingId && !trainingToUpdate.isRecurringMaster) {
        // Poderia permitir alterar o status, por exemplo.
        // Mas campos como data, hora, instrutor, capacidade vêm do mestre.
        // Para simplificar, vamos focar na edição do mestre.
        // Se quiser editar uma instância individualmente, ela deveria "desligar-se" da série.
        console.warn(`Tentativa de editar instância ID ${trainingId} diretamente. Esta funcionalidade pode precisar de mais lógica.`);
        // Vamos permitir edições, mas o admin deve estar ciente.
    }


    // Atualizar campos do treino
    if (name !== undefined) trainingToUpdate.name = name;
    if (description !== undefined) trainingToUpdate.description = description;
    if (date !== undefined) trainingToUpdate.date = date;
    if (time !== undefined) trainingToUpdate.time = time;
    if (capacity !== undefined) trainingToUpdate.capacity = parseInt(capacity);
    if (durationMinutes !== undefined) trainingToUpdate.durationMinutes = parseInt(durationMinutes);
    if (instructorId !== undefined) {
        const instructor = await db.Staff.findByPk(parseInt(instructorId), {transaction});
        if (!instructor || !['trainer', 'admin', 'physiotherapist'].includes(instructor.role)) {
             await transaction.rollback();
            return res.status(400).json({ message: 'Instrutor inválido para atualização.' });
        }
        trainingToUpdate.instructorId = parseInt(instructorId);
    }

    const oldIsRecurringMaster = trainingToUpdate.isRecurringMaster;
    trainingToUpdate.isRecurringMaster = !!isRecurringMaster;

    if (trainingToUpdate.isRecurringMaster) {
      trainingToUpdate.recurrenceType = recurrenceType;
      trainingToUpdate.recurrenceEndDate = recurrenceEndDate;
      // Se está a ser marcado como mestre, garantir que não tem pai
      trainingToUpdate.parentRecurringTrainingId = null; 
      trainingToUpdate.isGeneratedInstance = false;
    } else {
      // Se deixou de ser mestre, limpar campos de recorrência
      // E se não for uma instância gerada (parentRecurringTrainingId é null), continua como treino único
      trainingToUpdate.recurrenceType = null;
      trainingToUpdate.recurrenceEndDate = null;
    }

    await trainingToUpdate.save({ transaction });

    let generatedInstances = [];
    // Se o treino é/tornou-se um mestre recorrente, apaga instâncias futuras (sem bookings) e regenera.
    // Se deixou de ser recorrente (era mestre e agora isRecurringMaster=false), apaga todas as instâncias filhas futuras.
    if (trainingToUpdate.isRecurringMaster) {
      generatedInstances = await generateRecurringInstances(trainingToUpdate, transaction);
    } else if (oldIsRecurringMaster && !trainingToUpdate.isRecurringMaster) { 
      // Era mestre, mas deixou de ser. Apagar futuras instâncias filhas (sem bookings).
      // Esta lógica está dentro de generateRecurringInstances, mas precisa de uma chamada se isRecurringMaster for false
      // para garantir a limpeza se ele *deixou* de ser mestre.
       const existingChildInstances = await db.Training.findAll({
            where: {
                parentRecurringTrainingId: trainingToUpdate.id,
                date: { [Op.gt]: trainingToUpdate.date } 
            },
            include: [{ model: db.User, as: 'participants', attributes: ['id'] }],
            transaction
        });
        const childInstancesToDelete = existingChildInstances.filter(inst => (!inst.participants || inst.participants.length === 0));
        if (childInstancesToDelete.length > 0) {
            await db.Training.destroy({
                where: { id: { [Op.in]: childInstancesToDelete.map(inst => inst.id) }},
                transaction
            });
             console.log(`[updateTraining] ${childInstancesToDelete.length} instâncias futuras do ex-mestre ID ${trainingToUpdate.id} foram apagadas.`);
        }
    }


    await transaction.commit();
    res.status(200).json({
        message: 'Treino atualizado com sucesso!',
        training: trainingToUpdate,
        instancesAffectedCount: generatedInstances.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar treino:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar o treino.', errorDetails: error.message });
  }
};

// @desc    Cliente inscreve-se de forma recorrente num treino mestre
// @route   POST /api/trainings/:masterTrainingId/subscribe-recurring
// @access  Privado (Cliente)
exports.subscribeToRecurringTraining = async (req, res) => {
    const masterTrainingId = parseInt(req.params.masterTrainingId, 10);
    const clientId = req.user.id; 
    const { clientSubscriptionEndDate } = req.body;

    if (isNaN(masterTrainingId)) {
        return res.status(400).json({ message: "ID do treino mestre inválido." });
    }
    if (!clientSubscriptionEndDate) {
        return res.status(400).json({ message: "Data de fim da subscrição recorrente é obrigatória." });
    }

    const transaction = await db.sequelize.transaction();
    try {
        const masterTraining = await db.Training.findOne({
            where: { id: masterTrainingId, isRecurringMaster: true },
            transaction
        });

        if (!masterTraining) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treino mestre recorrente não encontrado ou não é um treino mestre.' });
        }

        // Data de fim da subscrição do cliente não pode ser depois da data de fim da série
        const subEndDateMoment = moment(clientSubscriptionEndDate);
        const seriesEndDateMoment = moment(masterTraining.recurrenceEndDate);
        if (subEndDateMoment.isAfter(seriesEndDateMoment)) {
            await transaction.rollback();
            return res.status(400).json({ message: `A sua subscrição não pode terminar depois de ${seriesEndDateMoment.format('DD/MM/YYYY')} (fim da série).` });
        }

        // Data de início da subscrição: a partir da data do treino mestre ou hoje (o que for mais tarde),
        // mas não antes da data de início do treino mestre.
        const subStartDateMoment = moment.max(moment(), moment(masterTraining.date));
        
        if (subEndDateMoment.isBefore(subStartDateMoment)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Período de subscrição inválido (data de fim anterior ao início efetivo).' });
        }
        
        // Encontrar todas as instâncias futuras (incluindo o mestre se aplicável e futuro) dentro do período
        const instancesToBook = await db.Training.findAll({
            where: {
                [Op.or]: [
                    { id: masterTraining.id }, 
                    { parentRecurringTrainingId: masterTraining.id }
                ],
                date: {
                    [Op.gte]: subStartDateMoment.format('YYYY-MM-DD'),
                    [Op.lte]: subEndDateMoment.format('YYYY-MM-DD')
                },
                status: 'scheduled'
            },
            include: [{ model: db.User, as: 'participants', attributes: ['id']}],
            order: [['date', 'ASC'], ['time', 'ASC']], // Processar por ordem cronológica
            transaction
        });

        if (instancesToBook.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Nenhuma aula encontrada para este treino recorrente no período selecionado.' });
        }

        const bookingsToCreate = [];
        let bookingsSkippedDueToCapacity = 0;
        let alreadyBookedCount = 0;

        for (const instance of instancesToBook) {
            // Verificar se o cliente já está inscrito nesta instância específica
            const existingBooking = await db.Booking.findOne({
                where: {
                    //clientId: clientId, // Adapte para o nome do campo no seu modelo Booking
                    userId: clientId, // Assumindo que Booking usa userId
                    trainingId: instance.id,
                    status: { [Op.ne]: 'cancelled' } // Não contar bookings cancelados
                },
                transaction
            });

            if (existingBooking) {
                alreadyBookedCount++;
                continue; 
            }

            // Contar participantes atuais da instância
            const participantsCount = await db.Booking.count({
                where: { 
                    trainingId: instance.id,
                    status: { [Op.ne]: 'cancelled' }
                },
                transaction
            });

            if (instance.capacity !== null && participantsCount >= instance.capacity) {
                bookingsSkippedDueToCapacity++;
                console.warn(`Capacidade esgotada para treino ID ${instance.id} em ${instance.date}. User ${clientId} não inscrito.`);
                continue; 
            }

            bookingsToCreate.push({
                //clientId: clientId, // Adapte se o seu modelo Booking usa clientId
                userId: clientId,   // Assumindo que Booking usa userId
                trainingId: instance.id,
                bookingDate: moment().toISOString(), // Data/hora da criação do booking
                status: 'confirmed', 
            });
        }
        
        if (bookingsToCreate.length > 0) {
            await db.Booking.bulkCreate(bookingsToCreate, { transaction });
        }
        
        await transaction.commit();
        
        let message = `Inscrição recorrente processada! ${bookingsToCreate.length} nova(s) aula(s) agendada(s).`;
        if (alreadyBookedCount > 0) message += ` Já estava inscrito em ${alreadyBookedCount} aula(s) deste período.`;
        if (bookingsSkippedDueToCapacity > 0) message += ` ${bookingsSkippedDueToCapacity} aula(s) foram puladas por falta de capacidade.`;
        if (bookingsToCreate.length === 0 && alreadyBookedCount === 0 && bookingsSkippedDueToCapacity === 0 && instancesToBook.length > 0) {
             message = 'Nenhuma nova aula foi agendada (verifique se já estava inscrito em todas ou se não há vagas).';
        } else if (bookingsToCreate.length === 0 && alreadyBookedCount > 0 && bookingsSkippedDueToCapacity === 0) {
            message = `Já estava inscrito em todas as ${alreadyBookedCount} aulas disponíveis neste período. Nenhuma nova inscrição foi feita.`;
        }


        res.status(200).json({ message });

    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao subscrever treino recorrente:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar subscrição recorrente.', errorDetails: error.message });
    }
};

// --- Manter as suas outras funções: getAllTrainings, getTrainingById, deleteTraining, bookTraining (para instância única), etc. ---
// Adicionei as modificadas acima. Certifique-se de que as outras estão corretas e exportadas.
// As funções como `adminBookClientForTraining` e `adminCancelClientBooking` funcionarão em instâncias individuais,
// sejam elas únicas ou geradas por recorrência.

// Re-exportar todas as funções, incluindo as modificadas e as novas
module.exports = {
  createTraining, // Modificada
  getAllTrainings: exports.getAllTrainings || require('./trainingController').getAllTrainings, // Mantendo a sua existente, se diferente
  getTrainingById: exports.getTrainingById || require('./trainingController').getTrainingById,
  updateTraining, // Modificada
  deleteTraining: exports.deleteTraining || require('./trainingController').deleteTraining,
  bookTraining: exports.bookTraining || require('./trainingController').bookTraining,
  cancelTrainingBooking: exports.cancelTrainingBooking || require('./trainingController').cancelTrainingBooking,
  getCurrentWeekSignups: exports.getCurrentWeekSignups || require('./trainingController').getCurrentWeekSignups,
  getTodayTrainingsCount: exports.getTodayTrainingsCount || require('./trainingController').getTodayTrainingsCount,
  adminBookClientForTraining: exports.adminBookClientForTraining || require('./trainingController').adminBookClientForTraining,
  adminCancelClientBooking: exports.adminCancelClientBooking || require('./trainingController').adminCancelClientBooking,
  adminGetTrainingWaitlist: exports.adminGetTrainingWaitlist || require('./trainingController').adminGetTrainingWaitlist,
  adminPromoteFromWaitlist: exports.adminPromoteFromWaitlist || require('./trainingController').adminPromoteFromWaitlist,
  subscribeToRecurringTraining, // Nova
};

// Se as funções acima com "exports." ou "require" não forem as suas, substitua-as pelas suas funções existentes
// do trainingController.js que me enviou, e apenas adicione/modifique as novas.
// Por exemplo, se a sua `getAllTrainings` original está correta, mantenha-a e apenas adicione as novas no export.
// O código que me enviou para trainingController já tinha a maioria destas.
// A forma mais simples é COPIAR as funções createTraining, updateTraining e subscribeToRecurringTraining
// para o seu ficheiro trainingController.js existente e adicionar subscribeToRecurringTraining aos exports.