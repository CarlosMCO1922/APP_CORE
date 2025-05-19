// backend/controllers/appointmentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const { format } = require('date-fns'); // Para formatar data para referenceMonth

// Função auxiliar para verificar conflitos (mantida da tua versão original)
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


// Função auxiliar interna para criar pagamento de sinal
const internalCreateSignalPayment = async (appointmentInstance, staffIdRequesting = null) => {
  if (!appointmentInstance || !appointmentInstance.id || !appointmentInstance.userId || !appointmentInstance.totalCost) {
    console.warn(`Consulta ID ${appointmentInstance?.id}: dados insuficientes para criar pagamento de sinal (userId: ${appointmentInstance?.userId}, totalCost: ${appointmentInstance?.totalCost}).`);
    return null;
  }
  const signalAmount = parseFloat((appointmentInstance.totalCost * 0.20).toFixed(2));
  if (signalAmount <= 0.00) { // Permitir sinal de 0.01 se for o caso, mas geralmente > 0
    console.log(`Sinal para consulta ${appointmentInstance.id} é zero ou negativo (${signalAmount}), não será criado pagamento.`);
    return null;
  }

  try {
    const existingSignalPayment = await db.Payment.findOne({
      where: {
        relatedResourceId: appointmentInstance.id,
        relatedResourceType: 'appointment',
        category: 'sinal_consulta',
        // status: 'pendente' // Considerar se um pago anterior bloquearia um novo pendente
      }
    });

    if (existingSignalPayment && existingSignalPayment.status === 'pendente') {
      console.log(`Pagamento de sinal pendente (ID: ${existingSignalPayment.id}) já existe para consulta ID ${appointmentInstance.id}.`);
      return existingSignalPayment;
    }
    if (existingSignalPayment && existingSignalPayment.status === 'pago') {
        console.log(`Pagamento de sinal (ID: ${existingSignalPayment.id}) já está pago para consulta ID ${appointmentInstance.id}.`);
        // Atualiza appointment para refletir que o sinal já estava pago, se necessário
        if (!appointmentInstance.signalPaid || appointmentInstance.status === 'agendada') {
            appointmentInstance.signalPaid = true;
            appointmentInstance.status = 'confirmada';
            await appointmentInstance.save();
        }
        return existingSignalPayment;
    }


    const today = new Date();
    const appointmentDate = new Date(appointmentInstance.date);
    const referenceMonth = format(appointmentDate, 'yyyy-MM'); // Mês da consulta

    // Assegura que temos o profissional para a descrição
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

// @desc    Admin cria uma nova consulta/horário
// @route   POST /appointments
// @access  Privado (Admin Staff)
const adminCreateAppointment = async (req, res) => {
  const { date, time, staffId, userId, notes, status, durationMinutes, totalCost } = req.body;

  if (!date || !time || !staffId || durationMinutes === undefined) {
    return res.status(400).json({ message: 'Data, hora, ID do profissional e duração são obrigatórios.' });
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

    // Verificar conflito para o staff ANTES de criar a consulta
    const conflict = await checkForStaffAppointmentConflict(parseInt(staffId), date, time, parseInt(durationMinutes));
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
      durationMinutes: parseInt(durationMinutes),
      totalCost: userId && totalCost ? parseFloat(totalCost) : null,
      signalPaid: false,
    });
    
    // Adiciona o objeto professional à instância para uso no internalCreateSignalPayment
    newAppointment.professional = professional;

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


// @desc    Staff responde a um pedido de consulta (aceita/rejeita)
// @route   PATCH /appointments/:appointmentId/respond
// @access  Privado (Staff - o profissional da consulta ou Admin)
const staffRespondToAppointmentRequest = async (req, res) => {
  const { appointmentId } = req.params;
  const { decision, totalCost } = req.body;
  const staffMemberId = req.staff.id;

  if (!decision || !['accept', 'reject'].includes(decision)) {
    return res.status(400).json({ message: "Decisão inválida. Deve ser 'accept' ou 'reject'." });
  }
  if (decision === 'accept' && (totalCost === undefined || parseFloat(totalCost) <= 0)) {
    return res.status(400).json({ message: "Custo total da consulta (positivo) é obrigatório ao aceitar." });
  }

  try {
    const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [{model: db.Staff, as: 'professional'}, {model: db.User, as: 'client'}]
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
      appointment.status = 'agendada'; // Cliente precisa de pagar o sinal para mudar para 'confirmada'
      appointment.totalCost = parseFloat(totalCost);
      appointment.signalPaid = false; // Garantir que começa como não pago
      await appointment.save();

      if (appointment.userId && appointment.totalCost > 0) {
        await internalCreateSignalPayment(appointment, staffMemberId);
      }
    } else { // decision === 'reject'
      appointment.status = 'rejeitada_pelo_staff';
      await appointment.save();
    }

    const updatedAppointment = await db.Appointment.findByPk(appointmentId, {
      include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]
    });

    res.status(200).json({
      message: `Pedido de consulta ${decision === 'accept' ? 'aceite e agendado (aguarda pagamento do sinal)' : 'rejeitado'} com sucesso.`,
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Erro (staff) ao responder a pedido de consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao responder ao pedido.', error: error.message });
  }
};

// @desc    Admin atualiza uma consulta
// @route   PUT /appointments/:id
// @access  Privado (Admin Staff)
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
        const originalTotalCost = appointment.totalCost;

        // Atualizar campos
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
            appointment.totalCost = userId ? parseFloat(totalCost) : null;
        }


        if (staffId) {
            const professional = await db.Staff.findByPk(parseInt(staffId));
            if (!professional) return res.status(404).json({ message: 'Profissional não encontrado.' });
            appointment.staffId = parseInt(staffId);
            appointment.professional = professional; // Atualiza a instância para uso no signalPayment
        }

        if (userId === null || userId === '') {
            appointment.userId = null;
            appointment.totalCost = null; // Sem cliente, sem custo/sinal
            appointment.signalPaid = false;
            if (!status || status === 'agendada' || status === 'confirmada') appointment.status = 'disponível';
        } else if (userId) {
            const clientUser = await db.User.findByPk(parseInt(userId));
            if (!clientUser) return res.status(404).json({ message: 'Cliente não encontrado.' });
            appointment.userId = parseInt(userId);
            if (!status || status === 'disponível') appointment.status = 'agendada'; // Se adiciona cliente, fica agendada
            if (appointment.totalCost === null && totalCost === undefined) {
                return res.status(400).json({ message: 'Custo total é obrigatório ao atribuir um cliente.' });
            }
        }
        
        // Lógica para sinal:
        // Se um cliente foi adicionado OU se a consulta passou para 'agendada' com um cliente E tem custo
        const needsSignalCheck = (
            (userId && userId !== originalUserId) || // Cliente foi adicionado/mudado
            (appointment.userId && status === 'agendada' && originalStatus !== 'agendada') // Passou para agendada com cliente
        ) && appointment.totalCost > 0 && !appointment.signalPaid;


        await appointment.save(); // Salva primeiro para ter o ID e dados atualizados

        if (needsSignalCheck) {
             await internalCreateSignalPayment(appointment, req.staff.id);
        }
        // Se o totalCost mudou e já existe um sinal PENDENTE, talvez atualizar o valor do sinal? (complexo)
        // Por agora, um novo sinal só é criado se não houver um pendente/pago.

        const updatedAppointment = await db.Appointment.findByPk(id, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Erro (admin) ao atualizar consulta:', error);
        if (error.name === 'SequelizeValidationError') { return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => e.message) });}
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};


// As tuas outras funções (getAllAppointments, getAppointmentById, adminDeleteAppointment, clientBookAppointment, clientCancelAppointmentBooking, clientRequestAppointment)
// permanecem como as tinhas, a menos que queiras que eu as reveja também.

module.exports = {
  adminCreateAppointment,
  getAllAppointments, // Mantém a tua lógica atual
  getAppointmentById, // Mantém a tua lógica atual
  adminUpdateAppointment,
  adminDeleteAppointment, // Mantém a tua lógica atual
  clientBookAppointment, // Mantém a tua lógica atual
  clientCancelAppointmentBooking, // Mantém a tua lógica atual
  clientRequestAppointment, // Mantém a tua lógica atual
  staffRespondToAppointmentRequest,
};