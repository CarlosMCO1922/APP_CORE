// backend/controllers/appointmentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize'); 
const { format } = require('date-fns'); 
const moment = require('moment');
const { _internalCreateNotification } = require('./notificationController');

// --- Função Auxiliar para Verificar Conflitos de Consulta ---
const checkForStaffAppointmentConflict = async (staffId, date, time, durationMinutes, excludeAppointmentId = null) => {
  const requestedStartTime = new Date(`${date}T${time}Z`);
  const requestedEndTime = new Date(requestedStartTime.getTime() + durationMinutes * 60000);

  const whereClauseForConflict = {
    staffId: staffId,
    date: date,
    status: { [Op.in]: ['agendada', 'confirmada', 'concluída', 'não_compareceu', 'pendente_aprovacao_staff'] },
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
      console.log(`Pagamento de sinal pendente já existe para consulta.`);
      return existingSignalPayment;
    }
    if (existingSignalPayment && existingSignalPayment.status === 'pago') {
        console.log(`Pagamento de sinal já está pago para consulta.`);
        if (!appointmentInstance.signalPaid || appointmentInstance.status === 'agendada') {
            appointmentInstance.signalPaid = true;
            appointmentInstance.status = 'confirmada';
            await appointmentInstance.save();
        }
        return existingSignalPayment;
    }

    const today = new Date();
    const appointmentDate = new Date(appointmentInstance.date); 
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
      description: `Sinal (20%) para consulta com ${professionalForDesc?.firstName || 'N/A'} em ${format(appointmentDate, 'dd/MM/yyyy')}`,
      status: 'pendente',
      staffId: staffIdRequesting || appointmentInstance.staffId,
      relatedResourceId: appointmentInstance.id,
      relatedResourceType: 'appointment',
    });
    console.log(`Pagamento de sinal criado para consulta.`);
    return signalPayment;
  } catch (error) {
    console.error(`Erro ao criar pagamento de sinal para consulta ${appointmentInstance.id}:`, error);
    return null;
  }
};


// --- Funções do Controlador ---
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

    newAppointment.professional = professional; 

    if (newAppointment.userId && newAppointment.status === 'agendada' && newAppointment.totalCost && newAppointment.totalCost > 0) {
      await internalCreateSignalPayment(newAppointment, req.staff.id);
    }

    const createdApptWithDetails = await db.Appointment.findByPk(newAppointment.id, {
        include: [{model: db.User, as: 'client'}, {model: db.Staff, as: 'professional'}]
    });


    if (newAppointment.staffId) {
      _internalCreateNotification({
        recipientStaffId: newAppointment.staffId,
        message: `Um novo horário/consulta foi adicionado à sua agenda para ${format(new Date(newAppointment.date), 'dd/MM/yyyy')} às ${newAppointment.time.substring(0,5)}.`,
        type: 'APPOINTMENT_SCHEDULED_STAFF',
        relatedResourceId: newAppointment.id,
        relatedResourceType: 'appointment',
        link: `/admin/calendario-geral` 
      });
    }
    // Notificar o cliente se uma consulta foi criada e atribuída a ele
    if (newAppointment.userId && clientUser) { 
      _internalCreateNotification({
        recipientUserId: newAppointment.userId,
        message: `Uma consulta com ${professional.firstName} foi agendada para si em ${format(new Date(newAppointment.date), 'dd/MM/yyyy')} às ${newAppointment.time.substring(0,5)}.`,
        type: 'APPOINTMENT_SCHEDULED_CLIENT',
        relatedResourceId: newAppointment.id,
        relatedResourceType: 'appointment',
        link: `/calendario`
      });
    }

    res.status(201).json(createdApptWithDetails);
  } catch (error) {
    console.error('Erro (admin) ao criar consulta:', error);
    if (error.name === 'SequelizeValidationError') { return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) }); }
    res.status(500).json({ message: 'Erro interno do servidor ao criar a consulta.', error: error.message });
  }
};


const getAllAppointments = async (req, res) => {
  const { staffId: queryStaffId, dateFrom, dateTo, status: queryStatus, userId: queryUserIdFromAdmin } = req.query;
  let whereClause = {};

  if (req.user && !req.staff) { 
    const clientId = req.user.id;
    whereClause = {
      [Op.or]: [
        { userId: clientId },
        { status: 'disponível', userId: null }, 
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
        const availableWithStatus = { status: 'disponível', userId: null }; 
        if(queryStaffId) availableWithStatus.staffId = queryStaffId;

        whereClause = { [Op.or]: [...clientSpecificStatuses, availableWithStatus ] };
    }
  } else if (req.staff) { 
    if (req.staff.role === 'admin') {
        if (queryUserIdFromAdmin) whereClause.userId = queryUserIdFromAdmin;
        if (queryStaffId) whereClause.staffId = queryStaffId;
        if (queryStatus) whereClause.status = queryStatus;
    } else { 
        whereClause = {
            [Op.or]: [
                { staffId: req.staff.id },
                { status: 'disponível', userId: null }, 
                
            ]
        };
        if (queryUserIdFromAdmin) { 
             whereClause = { [Op.and]: [ whereClause, { userId: queryUserIdFromAdmin } ]};
        }
        if (queryStatus) { 
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

    let canView = false;
    if (req.staff) { 
        if (req.staff.role === 'admin' || appointment.staffId === req.staff.id) {
            canView = true;
        }
    } else if (req.user) {
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


const adminUpdateAppointment = async (req, res) => {
    const { id } = req.params;
    const { date, time, staffId, userId, notes, status, durationMinutes, totalCost } = req.body;
    try {
        const appointment = await db.Appointment.findByPk(id, {
            include: [{model: db.Staff, as: 'professional'}] 
        });
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}

        const originalUserId = appointment.userId;
        const originalStatus = appointment.status;
        

        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (durationMinutes !== undefined) appointment.durationMinutes = parseInt(durationMinutes);
        if (notes !== undefined) appointment.notes = notes;
        if (status) {
            const allowedStatuses = db.Appointment.getAttributes().status.values;
            if (!allowedStatuses.includes(status)) { return res.status(400).json({ message: `Status inválido.` });}
            appointment.status = status;
        }
         if (totalCost !== undefined) { 
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
          
            if (['agendada', 'confirmada'].includes(appointment.status)) {
                appointment.status = 'disponível';
            }
        } else if (wantsToSetUserId) {
            const clientUser = await db.User.findByPk(parseInt(userId));
            if (!clientUser) return res.status(404).json({ message: 'Cliente não encontrado.' });
            appointment.userId = parseInt(userId);
            
            if (appointment.status === 'disponível') appointment.status = 'agendada';
            
            if (appointment.totalCost === null && totalCost === undefined) {
                 return res.status(400).json({ message: 'Custo total é obrigatório ao atribuir/manter um cliente na consulta.' });
            }
        }

        await appointment.save(); 

        
        const needsSignalCreation = appointment.userId &&
                                  appointment.totalCost > 0 &&
                                  !appointment.signalPaid &&
                                  (appointment.status === 'agendada' || (originalStatus !== 'agendada' && appointment.status === 'agendada') || (userId && userId !== originalUserId));

        if (needsSignalCreation) {
            
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


const adminDeleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await db.Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }
    await appointment.destroy();
    res.status(200).json({ message: 'Consulta eliminada com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar consulta.', error: error.message });
  }
};


const clientBookAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id; 

  try {
    const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [{model: db.Staff, as: 'professional'}] 
    });
    if (!appointment) { return res.status(404).json({ message: 'Horário de consulta não encontrado.' });}
    if (appointment.userId !== null) { return res.status(400).json({ message: 'Este horário já está ocupado.' });}
    if (appointment.status !== 'disponível') { return res.status(400).json({ message: 'Este horário não está disponível para marcação.' });}
    
    // Verificar se o cliente já tem outra consulta (não cancelada/rejeitada) no mesmo horário
    const clientOwnConflict = await checkForStaffAppointmentConflict(appointment.staffId, appointment.date, appointment.time, appointment.durationMinutes, null, userId);
    if(clientOwnConflict) { return res.status(409).json({ message: 'Já tens outra consulta marcada para esta data e hora com este profissional, ou o profissional está ocupado.' });}
    
    appointment.userId = userId;
    appointment.status = 'agendada'; 

    
    if (!appointment.totalCost || appointment.totalCost <= 0) {
      console.warn(`Consulta ID ${appointment.id} marcada por cliente não tem totalCost definido. Sinal não será gerado.`);
    }
    
    await appointment.save();

    if (appointment.userId && appointment.status === 'agendada' && appointment.totalCost && appointment.totalCost > 0) {
      await internalCreateSignalPayment(appointment, null); 
    }

    const bookedAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});

    // Notificar o cliente
    _internalCreateNotification({
      recipientUserId: userId,
      message: `Consulta marcada com ${appointment.professional?.firstName} para ${format(new Date(appointment.date), 'dd/MM/yyyy')} às ${appointment.time.substring(0,5)}. Aguarda pagamento do sinal para confirmação.`,
      type: 'APPOINTMENT_BOOKED_CLIENT',
      relatedResourceId: appointment.id,
      relatedResourceType: 'appointment',
      link: `/meus-pagamentos` 
    });

    // Notificar o profissional
    if (appointment.staffId) {
      const client = await db.User.findByPk(userId); 
      _internalCreateNotification({
        recipientStaffId: appointment.staffId,
        message: `Nova consulta marcada por ${client?.firstName} ${client?.lastName} para ${format(new Date(appointment.date), 'dd/MM/yyyy')} às ${appointment.time.substring(0,5)}.`,
        type: 'APPOINTMENT_BOOKED_STAFF',
        relatedResourceId: appointment.id,
        relatedResourceType: 'appointment',
        link: `/admin/calendario-geral`
      });
    }

    res.status(200).json({ message: 'Consulta marcada! Pagamento do sinal pendente.', appointment: bookedAppointment });
  } catch (error) {
    console.error('Erro (cliente) ao marcar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao marcar consulta.', error: error.message });
  }
};


const clientCancelAppointmentBooking = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  try {
    const appointment = await db.Appointment.findByPk(appointmentId);
    if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}
    if (appointment.userId !== userId) { return res.status(403).json({ message: 'Não tem permissão para cancelar esta consulta.' });}
    
    
    if (!['agendada', 'confirmada'].includes(appointment.status)) {
        return res.status(400).json({ message: `Não é possível cancelar uma consulta com status '${appointment.status}'. Contacte o suporte.`});
    }

    // Ao cancelar, o horário volta a estar disponível
    appointment.userId = null;
    appointment.status = 'disponível';
    appointment.signalPaid = false; 
    const signalPayment = await db.Payment.findOne({
        where: {
            relatedResourceId: appointment.id,
            relatedResourceType: 'appointment',
            category: 'sinal_consulta',
            userId: userId
        }
    });
    if (signalPayment && signalPayment.status === 'pendente') {
        signalPayment.status = 'cancelado'; 
        signalPayment.description = (signalPayment.description || '') + ` (Consulta ${appointment.id} cancelada pelo cliente)`;
        await signalPayment.save();
    } else if (signalPayment && signalPayment.status === 'pago') {
        appointment.status = 'cancelada_pelo_cliente'; 
    }

    await appointment.save();

    const updatedAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});

    // Notificar o cliente
    _internalCreateNotification({
      recipientUserId: userId,
      message: `A sua consulta de ${format(new Date(appointment.date), 'dd/MM/yyyy')} com ${appointment.professional?.firstName} foi cancelada.`,
      type: 'APPOINTMENT_CANCELLED_CLIENT',
      relatedResourceId: appointment.id,
      relatedResourceType: 'appointment',
      link: `/calendario`
    });

    // Notificar o profissional
    if (appointment.staffId) {
      const client = await db.User.findByPk(userId);
      _internalCreateNotification({
        recipientStaffId: appointment.staffId,
        message: `Consulta cancelada por ${client?.firstName} ${client?.lastName} para ${format(new Date(appointment.date), 'dd/MM/yyyy')} às ${appointment.time.substring(0,5)}. O horário está novamente disponível.`,
        type: 'APPOINTMENT_CANCELLED_STAFF',
        relatedResourceId: appointment.id,
        relatedResourceType: 'appointment',
        link: `/admin/calendario-geral`
      });
    }

    res.status(200).json({ message: 'Consulta cancelada com sucesso.', appointment: updatedAppointment });
  } catch (error) {
    console.error('Erro (cliente) ao cancelar consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cancelar consulta.', error: error.message });
  }
};


const clientRequestAppointment = async (req, res) => {
  const { staffId, date, time, notes, category, durationMinutes = 60 } = req.body; 
  const userId = req.user.id;

  if (!staffId || !date || !time || !category) {
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
            userId, date, time, 
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
    
    });

    // Notificar o profissional do pedido
    if (newAppointmentRequest.staffId) {
      const client = await db.User.findByPk(userId);
      _internalCreateNotification({
        recipientStaffId: newAppointmentRequest.staffId,
        message: `Novo pedido de consulta de ${client?.firstName} ${client?.lastName} para ${format(new Date(newAppointmentRequest.date), 'dd/MM/yyyy')} às ${newAppointmentRequest.time.substring(0,5)}.`,
        type: 'APPOINTMENT_REQUESTED_STAFF',
        relatedResourceId: newAppointmentRequest.id,
        relatedResourceType: 'appointment',
        link: `/admin/appointment-requests` 
      });
    }

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


const staffRespondToAppointmentRequest = async (req, res) => {
  const { appointmentId } = req.params;
  const { decision, totalCost } = req.body; 
  const staffMemberId = req.staff.id;

  if (!decision || !['accept', 'reject'].includes(decision)) {
    return res.status(400).json({ message: "Decisão inválida. Deve ser 'accept' ou 'reject'." });
  }
  if (decision === 'accept' && (totalCost === undefined || parseFloat(totalCost) <= 0)) {
    return res.status(400).json({ message: "Custo total da consulta (positivo) é obrigatório ao aceitar o pedido." });
  }

  try {
    const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [{model: db.Staff, as: 'professional'}] 
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
      appointment.status = 'agendada'; 
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

    // Notificar o cliente da decisão
    if (appointment.userId) {
      let clientMessage = '';
      let notificationType = '';
      if (decision === 'accept') {
        clientMessage = `O seu pedido de consulta com ${appointment.professional?.firstName} para ${format(new Date(appointment.date), 'dd/MM/yyyy')} foi ACEITE! Por favor, proceda ao pagamento do sinal para confirmar.`;
        notificationType = 'APPOINTMENT_REQUEST_ACCEPTED_CLIENT';
      } else { // decision === 'reject'
        clientMessage = `O seu pedido de consulta com ${appointment.professional?.firstName} para ${format(new Date(appointment.date), 'dd/MM/yyyy')} foi REJEITADO.`;
        notificationType = 'APPOINTMENT_REQUEST_REJECTED_CLIENT';
      }
      _internalCreateNotification({
        recipientUserId: appointment.userId,
        message: clientMessage,
        type: notificationType,
        relatedResourceId: appointment.id,
        relatedResourceType: 'appointment',
        link: decision === 'accept' ? `/meus-pagamentos` : `/calendario`
      });
    }

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


const getTodayAppointmentsCount = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const count = await db.Appointment.count({
      where: {
        date: today,
        status: { [Op.notIn]: ['disponível', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff'] }
      },
    });
    res.status(200).json({ todayAppointmentsCount: count || 0 });
  } catch (error) {
    console.error('Erro ao obter contagem de consultas de hoje:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

const getAvailableSlotsForProfessional = async (req, res) => {
  const { date, staffId, durationMinutes } = req.query;

  if (!date || !staffId || !durationMinutes) {
    return res.status(400).json({ message: 'Data, ID do profissional e duração são obrigatórios.' });
  }

  const professionalId = parseInt(staffId);
  const slotDuration = parseInt(durationMinutes);

  try {
    const workingHours = [
      { start: '10:00', end: '13:00' },
      { start: '15:00', end: '18:00' },
    ];

    const potentialSlots = [];
    workingHours.forEach(period => {
      let currentTime = moment.utc(`${date}T${period.start}`);
      const endTime = moment.utc(`${date}T${period.end}`);

      while (currentTime.clone().add(slotDuration, 'minutes').isSameOrBefore(endTime)) {
        potentialSlots.push(currentTime.format('HH:mm'));
        // CORREÇÃO LÓGICA: O incremento deve ser igual à duração do slot para não saltar horários.
        currentTime.add(slotDuration, 'minutes');
      }
    });
    
    const existingAppointments = await db.Appointment.findAll({
      where: {
        staffId: professionalId,
        date: date,
        status: { [Op.notIn]: ['disponível', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff'] }
      },
      attributes: ['time', 'durationMinutes']
    });

    const availableSlots = potentialSlots.filter(slot => {
      const slotStart = moment.utc(`${date}T${slot}`);
      const slotEnd = slotStart.clone().add(slotDuration, 'minutes');
      
      return !existingAppointments.some(existing => {
        const existingStart = moment.utc(`${date}T${existing.time}`);
        const existingEnd = existingStart.clone().add(existing.durationMinutes, 'minutes');
        return slotStart.isBefore(existingEnd) && slotEnd.isAfter(existingStart);
      });
    });

    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Erro detalhado ao gerar horários disponíveis:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao gerar horários.', errorDetails: error.message });
  }
};

module.exports = {
  checkForStaffAppointmentConflict, // Se esta função for usada por outros controladores (se não for, pode ser removida daqui)
  internalCreateSignalPayment, // O mesmo que acima
  adminCreateAppointment,
  getAllAppointments,
  getAppointmentById,
  adminUpdateAppointment,
  adminDeleteAppointment,
  clientBookAppointment,
  clientCancelAppointmentBooking,
  clientRequestAppointment,
  staffRespondToAppointmentRequest,
  getTodayAppointmentsCount,
  getAvailableSlotsForProfessional, 
};