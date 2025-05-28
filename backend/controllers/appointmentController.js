// backend/controllers/appointmentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize'); // Sequelize pode não ser usado diretamente aqui
const { format } = require('date-fns'); // Para formatar data

// --- Função Auxiliar para Verificar Conflitos de Consulta (da tua versão) ---
const checkForStaffAppointmentConflict = async (staffId, date, time, durationMinutes, excludeAppointmentId = null) => {
  const requestedStartTime = new Date(`${date}T${time}Z`);
  const requestedEndTime = new Date(requestedStartTime.getTime() + durationMinutes * 60000);

  const whereClauseForConflict = {
    staffId: staffId,
    date: date,
    status: { [Op.in]: ['agendada', 'confirmada', 'concluída', 'não_compareceu', 'pendente_aprovacao_staff'] }, // Adicionado 'confirmada'
    ...(excludeAppointmentId && { id: { [Op.ne]: excludeAppointmentId } })
  };

  const existingAppointments = await db.Appointment.findAll({ where: whereClauseForConflict });

  for (const existingAppt of existingAppointments) {
    const existingStartTime = new Date(`${existingAppt.date}T${existingAppt.time}Z`);
    const existingEndTime = new Date(existingStartTime.getTime() + existingAppt.durationMinutes * 60000);

    if (requestedStartTime < existingEndTime && requestedEndTime > existingStartTime) {
      return existingAppt;
    }
  }
  return null;
};

// --- Função Auxiliar Interna para Criar Pagamento de Sinal ---
const internalCreateSignalPayment = async (appointmentInstance, staffIdRequesting = null) => {
  if (!appointmentInstance || !appointmentInstance.id || !appointmentInstance.userId || !appointmentInstance.totalCost) {
    console.warn(`Consulta ID ${appointmentInstance?.id}: dados insuficientes para criar pagamento de sinal (userId: ${appointmentInstance?.userId}, totalCost: ${appointmentInstance?.totalCost}).`);
    return null;
  }
  const signalAmount = parseFloat((appointmentInstance.totalCost * 0.20).toFixed(2));
  if (signalAmount <= 0.00) {
    console.log(`Sinal para consulta ${appointmentInstance.id} é zero ou negativo (${signalAmount}), não será criado pagamento.`);
    return null;
  }

  try {
    const existingSignalPayment = await db.Payment.findOne({
      where: {
        relatedResourceId: appointmentInstance.id,
        relatedResourceType: 'appointment',
        category: 'sinal_consulta',
      }
    });

    if (existingSignalPayment && existingSignalPayment.status === 'pendente') {
      console.log(`Pagamento de sinal pendente (ID: ${existingSignalPayment.id}) já existe para consulta ID ${appointmentInstance.id}.`);
      return existingSignalPayment;
    }
    if (existingSignalPayment && existingSignalPayment.status === 'pago') {
        console.log(`Pagamento de sinal (ID: ${existingSignalPayment.id}) já está pago para consulta ID ${appointmentInstance.id}.`);
        if (!appointmentInstance.signalPaid || appointmentInstance.status === 'agendada') {
            appointmentInstance.signalPaid = true;
            appointmentInstance.status = 'confirmada';
            await appointmentInstance.save();
        }
        return existingSignalPayment;
    }

    const today = new Date();
    const appointmentDate = new Date(appointmentInstance.date); // Usar a data da consulta
    const referenceMonth = format(appointmentDate, 'yyyy-MM');

    let professionalForDesc = appointmentInstance.professional;
    if (!professionalForDesc && appointmentInstance.staffId) {
        professionalForDesc = await db.Staff.findByPk(appointmentInstance.staffId);
    }

    const signalPayment = await db.Payment.create({
      userId: appointmentInstance.userId,
      amount: signalAmount,
      paymentDate: format(today, 'yyyy-MM-dd'),
      referenceMonth: referenceMonth,
      category: 'sinal_consulta',
      description: `Sinal (20%) para consulta ID ${appointmentInstance.id} com ${professionalForDesc?.firstName || 'N/A'} em ${format(appointmentDate, 'dd/MM/yyyy')}`,
      status: 'pendente',
      staffId: staffIdRequesting || appointmentInstance.staffId,
      relatedResourceId: appointmentInstance.id,
      relatedResourceType: 'appointment',
    });
    console.log(`Pagamento de sinal ID ${signalPayment.id} criado para consulta ID ${appointmentInstance.id}.`);
    return signalPayment;
  } catch (error) {
    console.error(`Erro ao criar pagamento de sinal para consulta ${appointmentInstance.id}:`, error);
    return null;
  }
};


// --- Funções do Controlador ---

// @desc    Admin cria uma nova consulta/horário
// @route   POST /appointments (ou /api/appointments)
// @access  Privado (Admin Staff)
const adminCreateAppointment = async (req, res) => {
  const { date, time, staffId, userId, notes, status, durationMinutes, totalCost } = req.body;

  if (!date || !time || !staffId || durationMinutes === undefined) {
    return res.status(400).json({ message: 'Data, hora, ID do profissional e duração são obrigatórios.' });
  }
  const parsedDuration = parseInt(durationMinutes);
  if (isNaN(parsedDuration) || parsedDuration <=0) {
    return res.status(400).json({ message: 'Duração deve ser um número positivo.' });
  }
  if (userId && (totalCost === undefined || parseFloat(totalCost) <= 0)) {
    return res.status(400).json({ message: 'Se atribuir um cliente, o custo total da consulta (positivo) é obrigatório para gerar o sinal.' });
  }

  try {
    const professional = await db.Staff.findByPk(parseInt(staffId));
    if (!professional) { return res.status(404).json({ message: 'Profissional (staff) não encontrado.' }); }
    if (!['physiotherapist', 'trainer', 'admin'].includes(professional.role)) { return res.status(400).json({ message: 'O ID do profissional fornecido não tem permissão para consultas.' });}

    let clientUser = null;
    if (userId) {
        clientUser = await db.User.findByPk(parseInt(userId));
        if (!clientUser) { return res.status(404).json({ message: 'Cliente (user) não encontrado.' }); }
    }

    const conflict = await checkForStaffAppointmentConflict(parseInt(staffId), date, time, parsedDuration);
    if (conflict) {
      return res.status(409).json({ message: `Conflito de horário para o profissional. Já existe uma consulta (${conflict.status}) nesse período.` });
    }

    const newAppointment = await db.Appointment.create({
      date,
      time,
      staffId: parseInt(staffId),
      userId: userId ? parseInt(userId) : null,
      notes,
      status: userId ? (status || 'agendada') : (status || 'disponível'),
      durationMinutes: parsedDuration,
      totalCost: userId && totalCost ? parseFloat(totalCost) : null,
      signalPaid: false,
    });

    newAppointment.professional = professional; // Para uso no internalCreateSignalPayment

    if (newAppointment.userId && newAppointment.status === 'agendada' && newAppointment.totalCost && newAppointment.totalCost > 0) {
      await internalCreateSignalPayment(newAppointment, req.staff.id);
    }

    const createdApptWithDetails = await db.Appointment.findByPk(newAppointment.id, {
        include: [{model: db.User, as: 'client'}, {model: db.Staff, as: 'professional'}]
    });

    res.status(201).json(createdApptWithDetails);
  } catch (error) {
    console.error('Erro (admin) ao criar consulta:', error);
    if (error.name === 'SequelizeValidationError') { return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) }); }
    res.status(500).json({ message: 'Erro interno do servidor ao criar a consulta.', error: error.message });
  }
};

// @desc    Lista consultas com base no papel do requisitante
// @route   GET /appointments (ou /api/appointments)
// @access  Protegido
const getAllAppointments = async (req, res) => {
  const { staffId: queryStaffId, dateFrom, dateTo, status: queryStatus, userId: queryUserIdFromAdmin } = req.query;
  let whereClause = {};

  if (req.user && !req.staff) { // Cliente autenticado
    const clientId = req.user.id;
    whereClause = {
      [Op.or]: [
        { userId: clientId },
        { status: 'disponível', userId: null }, // Cliente também vê disponíveis
        //{ userId: clientId, status: 'pendente_aprovacao_staff' },
        //{ userId: clientId, status: 'confirmada'} // Incluir consultas confirmadas
      ]
    };
    if (queryStaffId) {
      const clientSpecificClause = whereClause[Op.or].filter(cond => cond.userId === clientId);
      const availableForStaffClause = { status: 'disponível', userId: null, staffId: queryStaffId };
      whereClause = {
        [Op.or]: [
          ...clientSpecificClause.map(cond => ({...cond, staffId: queryStaffId})),
          availableForStaffClause
        ]
      };
    }
    if (queryStatus) {
        const clientSpecificStatuses = whereClause[Op.or].filter(cond => cond.userId === clientId).map(cond => ({ ...cond, status: queryStatus }));
        const availableWithStatus = { status: 'disponível', userId: null }; // Mantém disponíveis
        if(queryStaffId) availableWithStatus.staffId = queryStaffId;

        whereClause = { [Op.or]: [...clientSpecificStatuses, availableWithStatus ] };
    }
  } else if (req.staff) { // Staff/Admin autenticado
    if (req.staff.role === 'admin') {
        if (queryUserIdFromAdmin) whereClause.userId = queryUserIdFromAdmin;
        if (queryStaffId) whereClause.staffId = queryStaffId;
        if (queryStatus) whereClause.status = queryStatus;
    } else { // Staff não-admin (trainer, physiotherapist)
        // Staff vê as suas próprias consultas + as disponíveis de todos + as pendentes para si
        whereClause = {
            [Op.or]: [
                { staffId: req.staff.id },
                { status: 'disponível', userId: null }, // Todos os disponíveis
                //{ staffId: req.staff.id, status: 'pendente_aprovacao_staff' },
                //{ staffId: req.staff.id, status: 'confirmada'} // Incluir confirmadas do staff
            ]
        };
        if (queryUserIdFromAdmin) { // Se staff não admin filtra por cliente
             whereClause = { [Op.and]: [ whereClause, { userId: queryUserIdFromAdmin } ]};
        }
        if (queryStatus) { // Se staff não admin filtra por status
             whereClause = { [Op.and]: [ whereClause, { status: queryStatus } ]};
        }
    }
  } else {
    return res.status(403).json({ message: "Acesso não autorizado - utilizador não identificado." });
  }

  if (dateFrom && dateTo) whereClause.date = { [Op.between]: [dateFrom, dateTo] };
  else if (dateFrom) whereClause.date = { [Op.gte]: dateFrom };
  else if (dateTo) whereClause.date = { [Op.lte]: dateTo };

  try {
    const appointments = await db.Appointment.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.Staff, as: 'professional', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar as consultas.', error: error.message });
  }
};

// @desc    Obtém uma consulta por ID
// @route   GET /appointments/:id (ou /api/appointments/:id)
// @access  Privado (Qualquer utilizador autenticado com permissão)
const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await db.Appointment.findByPk(id, {
      include: [
        { model: db.User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.Staff, as: 'professional', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }
      ],
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }
    // Adicionar lógica de permissão:
    // Cliente só pode ver as suas ou as disponíveis. Staff pode ver as suas. Admin vê todas.
    let canView = false;
    if (req.staff) { // Admin ou Staff
        if (req.staff.role === 'admin' || appointment.staffId === req.staff.id) {
            canView = true;
        }
    } else if (req.user) { // Cliente
        if (appointment.userId === req.user.id || appointment.status === 'disponível') {
            canView = true;
        }
    }

    if (!canView) {
        return res.status(403).json({ message: 'Não tem permissão para ver esta consulta.' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Erro ao obter consulta por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin atualiza uma consulta
// @route   PUT /appointments/:id (ou /api/appointments/:id)
// @access  Privado (Admin Staff)
const adminUpdateAppointment = async (req, res) => {
    const { id } = req.params;
    const { date, time, staffId, userId, notes, status, durationMinutes, totalCost } = req.body;
    try {
        const appointment = await db.Appointment.findByPk(id, {
            include: [{model: db.Staff, as: 'professional'}] // Para ter o professional para o sinal
        });
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}

        const originalUserId = appointment.userId;
        const originalStatus = appointment.status;
        // const originalTotalCost = appointment.totalCost; // Não usado diretamente na lógica abaixo

        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (durationMinutes !== undefined) appointment.durationMinutes = parseInt(durationMinutes);
        if (notes !== undefined) appointment.notes = notes;
        if (status) {
            const allowedStatuses = db.Appointment.getAttributes().status.values;
            if (!allowedStatuses.includes(status)) { return res.status(400).json({ message: `Status inválido.` });}
            appointment.status = status;
        }
         if (totalCost !== undefined) { // Se totalCost é fornecido
            appointment.totalCost = (userId || appointment.userId) && parseFloat(totalCost) > 0 ? parseFloat(totalCost) : null;
        }

        if (staffId) {
            const professional = await db.Staff.findByPk(parseInt(staffId));
            if (!professional) return res.status(404).json({ message: 'Profissional não encontrado.' });
            appointment.staffId = parseInt(staffId);
            appointment.professional = professional;
        }

        const wantsToSetUserId = userId !== undefined && userId !== null && userId !== '';
        const wantsToClearUserId = userId === null || userId === '';

        if (wantsToClearUserId) {
            appointment.userId = null;
            appointment.totalCost = null;
            appointment.signalPaid = false;
            // Se estava agendada/confirmada e cliente é removido, volta a disponível
            if (['agendada', 'confirmada'].includes(appointment.status)) {
                appointment.status = 'disponível';
            }
        } else if (wantsToSetUserId) {
            const clientUser = await db.User.findByPk(parseInt(userId));
            if (!clientUser) return res.status(404).json({ message: 'Cliente não encontrado.' });
            appointment.userId = parseInt(userId);
            // Se estava disponível e agora tem cliente, passa a agendada (ou mantém status se já era agendada/confirmada)
            if (appointment.status === 'disponível') appointment.status = 'agendada';
            // Se o custo não foi fornecido no body mas o cliente foi adicionado, e o appointment não tinha custo, erro
            if (appointment.totalCost === null && totalCost === undefined) {
                 return res.status(400).json({ message: 'Custo total é obrigatório ao atribuir/manter um cliente na consulta.' });
            }
        }

        await appointment.save(); // Salva as alterações básicas

        // Lógica para criar sinal se necessário
        const needsSignalCreation = appointment.userId &&
                                  appointment.totalCost > 0 &&
                                  !appointment.signalPaid &&
                                  (appointment.status === 'agendada' || (originalStatus !== 'agendada' && appointment.status === 'agendada') || (userId && userId !== originalUserId));

        if (needsSignalCreation) {
            // Traz o professional atualizado, caso tenha mudado
            if (!appointment.professional || appointment.professional.id !== appointment.staffId) {
                appointment.professional = await db.Staff.findByPk(appointment.staffId);
            }
             await internalCreateSignalPayment(appointment, req.staff.id);
        }

        const updatedAppointment = await db.Appointment.findByPk(id, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Erro (admin) ao atualizar consulta:', error);
        if (error.name === 'SequelizeValidationError') { return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => e.message) });}
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar consulta.', error: error.message });
    }
};

// @desc    Admin elimina uma consulta
// @route   DELETE /appointments/:id (ou /api/appointments/:id)
// @access  Privado (Admin Staff)
const adminDeleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await db.Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }
    // Opcional: se o pagamento de sinal estiver ligado, o que fazer?
    // Por agora, apenas apaga a consulta.
    await appointment.destroy();
    res.status(200).json({ message: 'Consulta eliminada com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar consulta.', error: error.message });
  }
};

// @desc    Cliente marca um horário 'disponível'
// @route   POST /appointments/:appointmentId/book
// @access  Privado (Cliente)
const clientBookAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id; // Do middleware protect
  // Opcional: receber totalCost aqui se o preço for definido pelo tipo de consulta ao invés de pelo admin
  // const { totalCost } = req.body;

  try {
    const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [{model: db.Staff, as: 'professional'}] // Para o sinal
    });
    if (!appointment) { return res.status(404).json({ message: 'Horário de consulta não encontrado.' });}
    if (appointment.userId !== null) { return res.status(400).json({ message: 'Este horário já está ocupado.' });}
    if (appointment.status !== 'disponível') { return res.status(400).json({ message: 'Este horário não está disponível para marcação.' });}
    
    // Verificar se o cliente já tem outra consulta (não cancelada/rejeitada) no mesmo horário
    const clientOwnConflict = await checkForStaffAppointmentConflict(appointment.staffId, appointment.date, appointment.time, appointment.durationMinutes, null, userId);
    if(clientOwnConflict) { return res.status(409).json({ message: 'Já tens outra consulta marcada para esta data e hora com este profissional, ou o profissional está ocupado.' });}
    
    appointment.userId = userId;
    appointment.status = 'agendada'; // Muda para agendada, sinal será gerado.

    // ASSUMIR QUE O 'totalCost' JÁ FOI DEFINIDO NO HORÁRIO DISPONÍVEL PELO ADMIN, OU SERÁ DEFINIDO
    // SE totalCost não estiver na consulta e for necessário, lançar erro ou pedir ao cliente (mais complexo)
    if (!appointment.totalCost || appointment.totalCost <= 0) {
      // Poderia ter uma lógica para buscar um preço padrão para este tipo de staff/serviço
      // Por agora, vamos assumir que o admin deve definir totalCost em horários disponíveis que podem ser marcados.
      // Se não, podemos pedir ao frontend para enviar o totalCost se souber.
      // Ou, como alternativa, o admin define o totalCost no momento da criação do horário disponível.
      // Se o admin não definir um totalCost para um horário disponível, o sinal não será gerado.
      console.warn(`Consulta ID ${appointment.id} marcada por cliente não tem totalCost definido. Sinal não será gerado.`);
    }
    
    await appointment.save();

    if (appointment.userId && appointment.status === 'agendada' && appointment.totalCost && appointment.totalCost > 0) {
      await internalCreateSignalPayment(appointment, null); // staffIdRequesting pode ser null aqui
    }

    const bookedAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
    res.status(200).json({ message: 'Consulta marcada! Pagamento do sinal pendente.', appointment: bookedAppointment });
  } catch (error) {
    console.error('Erro (cliente) ao marcar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao marcar consulta.', error: error.message });
  }
};

// @desc    Cliente cancela a sua própria marcação
// @route   DELETE /appointments/:appointmentId/book
// @access  Privado (Cliente)
const clientCancelAppointmentBooking = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  try {
    const appointment = await db.Appointment.findByPk(appointmentId);
    if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}
    if (appointment.userId !== userId) { return res.status(403).json({ message: 'Não tem permissão para cancelar esta consulta.' });}
    
    // Regras de cancelamento: só pode cancelar se estiver 'agendada' ou 'confirmada' (sinal pago)
    // Se 'confirmada', o sinal pode ou não ser reembolsável (lógica de negócio para o futuro).
    if (!['agendada', 'confirmada'].includes(appointment.status)) {
        return res.status(400).json({ message: `Não é possível cancelar uma consulta com status '${appointment.status}'. Contacte o suporte.`});
    }

    // Ao cancelar, o horário volta a estar disponível
    appointment.userId = null;
    appointment.status = 'disponível';
    appointment.signalPaid = false; // Resetar sinal
    // appointment.totalCost = null; // Opcional: manter ou limpar o custo do horário
    
    // Opcional: Lidar com o pagamento do sinal associado (marcar como 'cancelado' ou 'reembolsado'?)
    // Por agora, apenas a consulta é alterada.
    const signalPayment = await db.Payment.findOne({
        where: {
            relatedResourceId: appointment.id,
            relatedResourceType: 'appointment',
            category: 'sinal_consulta',
            userId: userId
        }
    });
    if (signalPayment && signalPayment.status === 'pendente') {
        signalPayment.status = 'cancelado'; // ou 'rejeitado'
        signalPayment.description = (signalPayment.description || '') + ` (Consulta ${appointment.id} cancelada pelo cliente)`;
        await signalPayment.save();
    } else if (signalPayment && signalPayment.status === 'pago') {
        // Aqui entraria a lógica de reembolso se aplicável.
        // Por agora, podemos adicionar uma nota ou deixar como está.
        // Para simplificar, não vamos alterar o status do pagamento se já foi pago.
        // Mas podemos querer marcar a consulta como 'cancelada_pelo_cliente' em vez de 'disponível' se o sinal foi pago.
        // Decisão de negócio: se sinal pago e cliente cancela, o horário volta a disponível ou fica como "cancelado"?
        // Vamos manter 'disponível' por agora, mas o pagamento continua 'pago'.
        appointment.status = 'cancelada_pelo_cliente'; // Mudar status para refletir cancelamento após pagamento de sinal
    }

    await appointment.save();

    const updatedAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
    res.status(200).json({ message: 'Consulta cancelada com sucesso.', appointment: updatedAppointment });
  } catch (error) {
    console.error('Erro (cliente) ao cancelar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar consulta.', error: error.message });
  }
};

// @desc    Cliente solicita uma nova consulta (fica pendente de aprovação do staff)
// @route   POST /appointments/request
// @access  Privado (Cliente)
const clientRequestAppointment = async (req, res) => {
  const { staffId, date, time, notes, durationMinutes = 60 } = req.body; // Usar durationMinutes do body ou default
  const userId = req.user.id;

  if (!staffId || !date || !time) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: ID do profissional, data e hora.' });
  }
  if (isNaN(parseInt(staffId))) {
    return res.status(400).json({ message: 'ID do profissional deve ser um número.' });
  }
  const parsedDuration = parseInt(durationMinutes);
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({message: "Duração inválida."});
  }


  try {
    const professional = await db.Staff.findByPk(parseInt(staffId));
    if (!professional || !['physiotherapist', 'trainer', 'admin'].includes(professional.role)) {
      return res.status(404).json({ message: 'Profissional não encontrado ou não habilitado para consultas.' });
    }

    const conflict = await checkForStaffAppointmentConflict(parseInt(staffId), date, time, parsedDuration);
    if (conflict) {
      return res.status(409).json({ message: `O profissional selecionado já tem uma consulta (${conflict.status}) nesse período. Por favor, escolha outro horário.` });
    }
    
    const clientOwnConflict = await db.Appointment.findOne({
        where: {
            userId, date, time, // Simplificado, idealmente verificar sobreposição de duração
            status: { [Op.notIn]: ['cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff', 'disponível']}
        }
    });
    if (clientOwnConflict) {
        return res.status(409).json({ message: 'Já tens outra consulta agendada para este horário.' });
    }

    const newAppointmentRequest = await db.Appointment.create({
      userId,
      staffId: parseInt(staffId),
      date,
      time,
      durationMinutes: parsedDuration,
      notes,
      status: 'pendente_aprovacao_staff',
      // totalCost e signalPaid serão definidos quando o staff aceitar
    });

    res.status(201).json({
        message: 'Pedido de consulta enviado com sucesso! Aguarda a aprovação do profissional.',
        appointment: newAppointmentRequest
    });

  } catch (error) {
    console.error('Erro (cliente) ao solicitar consulta:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao solicitar consulta.', error: error.message });
  }
};

// @desc    Staff responde a um pedido de consulta (aceita/rejeita)
// @route   PATCH /appointments/:appointmentId/respond
// @access  Privado (Staff)
const staffRespondToAppointmentRequest = async (req, res) => {
  const { appointmentId } = req.params;
  const { decision, totalCost } = req.body; // totalCost é enviado pelo frontend quando staff aceita
  const staffMemberId = req.staff.id;

  if (!decision || !['accept', 'reject'].includes(decision)) {
    return res.status(400).json({ message: "Decisão inválida. Deve ser 'accept' ou 'reject'." });
  }
  if (decision === 'accept' && (totalCost === undefined || parseFloat(totalCost) <= 0)) {
    return res.status(400).json({ message: "Custo total da consulta (positivo) é obrigatório ao aceitar o pedido." });
  }

  try {
    const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [{model: db.Staff, as: 'professional'}] // Para usar no internalCreateSignalPayment
    });

    if (!appointment) { return res.status(404).json({ message: 'Pedido de consulta não encontrado.' }); }
    if (appointment.staffId !== staffMemberId && req.staff.role !== 'admin') { return res.status(403).json({ message: 'Não tem permissão para responder a este pedido.' }); }
    if (appointment.status !== 'pendente_aprovacao_staff') { return res.status(400).json({ message: `Este pedido já foi processado (status atual: ${appointment.status}).` }); }

    if (decision === 'accept') {
      const conflict = await checkForStaffAppointmentConflict(
        appointment.staffId,
        appointment.date,
        appointment.time,
        appointment.durationMinutes,
        appointment.id
      );
      if (conflict) {
        return res.status(409).json({
          message: 'Conflito de horário detetado com outra consulta. Não é possível aprovar este pedido no momento.',
          conflictingAppointmentId: conflict.id
        });
      }
      appointment.status = 'agendada'; // Muda para agendada; sinal será gerado e cliente paga para confirmar
      appointment.totalCost = parseFloat(totalCost);
      appointment.signalPaid = false;
      await appointment.save();

      // Criar pagamento de sinal
      if (appointment.userId && appointment.totalCost > 0) {
        await internalCreateSignalPayment(appointment, staffMemberId);
      }

    } else { // decision === 'reject'
      appointment.status = 'rejeitada_pelo_staff';
      await appointment.save();
    }

    const updatedAppointmentWithDetails = await db.Appointment.findByPk(appointmentId, {
      include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]
    });

    res.status(200).json({
      message: `Pedido de consulta ${decision === 'accept' ? 'aceite. Aguarda pagamento do sinal pelo cliente.' : 'rejeitado'} com sucesso.`,
      appointment: updatedAppointmentWithDetails
    });

  } catch (error) {
    console.error('Erro (staff) ao responder a pedido de consulta:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao responder ao pedido.', error: error.message });
  }
};

// @desc    Admin obtém o número de consultas agendadas para hoje
// @route   GET /api/appointments/stats/today-count
// @access  Privado (Admin Staff)
const getTodayAppointmentsCount = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const count = await db.Appointment.count({
      where: {
        date: today,
        // Considerar apenas status relevantes se necessário, ex: não 'disponível' ou 'cancelada'
        status: { [Op.notIn]: ['disponível', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff'] }
      },
    });
    res.status(200).json({ todayAppointmentsCount: count || 0 });
  } catch (error) {
    console.error('Erro ao obter contagem de consultas de hoje:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


module.exports = {
  adminCreateAppointment,
  getAllAppointments,
  getAppointmentById,
  adminUpdateAppointment,
  adminDeleteAppointment,
  clientBookAppointment,
  clientCancelAppointmentBooking,
  clientRequestAppointment,
  staffRespondToAppointmentRequest,
  getTodayAppointmentsCount
};