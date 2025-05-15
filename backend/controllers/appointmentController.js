// backend/controllers/appointmentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize'); // Certifica-te que Op e Sequelize estão importados

// --- Função Auxiliar para Verificar Conflitos de Consulta ---
/**
 * Verifica se há um conflito de horário para uma CONSULTA de um determinado staff.
 * Considera apenas outras CONSULTAS com status que indicam ocupação.
 * @param {string} staffId - ID do Staff.
 * @param {string} date - Data da consulta (YYYY-MM-DD).
 * @param {string} time - Hora da consulta (HH:MM:SS).
 * @param {number} durationMinutes - Duração da consulta em minutos.
 * @param {number|null} excludeAppointmentId - ID de uma consulta a ser excluída da verificação (útil ao atualizar).
 * @returns {Promise<db.Appointment|null>} Retorna a consulta conflituosa se houver, ou null.
 */
const checkForStaffAppointmentConflict = async (staffId, date, time, durationMinutes, excludeAppointmentId = null) => {
  const requestedStartTime = new Date(`${date}T${time}Z`); // Adiciona Z para tratar como UTC
  const requestedEndTime = new Date(requestedStartTime.getTime() + durationMinutes * 60000);

  const whereClauseForConflict = {
    staffId: staffId,
    date: date,
    // Considera conflito se for agendada, concluída, ou não compareceu.
    // Pendente de aprovação também pode ser um conflito se quisermos ser estritos.
    // Disponível não é conflito. Canceladas/rejeitadas também não.
    status: { [Op.in]: ['agendada', 'concluída', 'não_compareceu', 'pendente_aprovacao_staff'] },
    ...(excludeAppointmentId && { id: { [Op.ne]: excludeAppointmentId } })
  };

  const existingAppointments = await db.Appointment.findAll({ where: whereClauseForConflict });

  for (const existingAppt of existingAppointments) {
    const existingStartTime = new Date(`${existingAppt.date}T${existingAppt.time}Z`);
    const existingEndTime = new Date(existingStartTime.getTime() + existingAppt.durationMinutes * 60000);

    // Verifica sobreposição: (StartA < EndB) and (EndA > StartB)
    if (requestedStartTime < existingEndTime && requestedEndTime > existingStartTime) {
      return existingAppt; // Conflito encontrado, retorna a consulta conflituosa
    }
  }
  return null; // Nenhum conflito
};


// --- Funções do Controlador (mantém as tuas funções existentes) ---
// Vou re-listar as funções anteriores para garantir que o module.exports está completo.
// Certifica-te de que os nomes correspondem aos que usas nas tuas rotas.

const adminCreateAppointment = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { date, time, staffId, userId, notes, status } = req.body;
    if (!date || !time || !staffId) { return res.status(400).json({ message: 'Por favor, forneça data, hora e ID do profissional.' }); }
    if (isNaN(parseInt(staffId))) { return res.status(400).json({ message: 'O ID do profissional deve ser um número.' }); }
    try {
        const professional = await db.Staff.findByPk(parseInt(staffId));
        if (!professional) { return res.status(404).json({ message: 'Profissional (staff) não encontrado.' }); }
        if (!['physiotherapist', 'trainer', 'admin'].includes(professional.role)) { return res.status(400).json({ message: 'O ID do profissional fornecido não tem permissão para consultas.' });}
        if (userId) {
            if (isNaN(parseInt(userId))) { return res.status(400).json({ message: 'O ID do cliente deve ser um número.' }); }
            const clientUser = await db.User.findByPk(parseInt(userId));
            if (!clientUser) { return res.status(404).json({ message: 'Cliente (user) não encontrado para atribuição.' }); }
            // Simplificando a verificação de conflito aqui, a lógica mais robusta está em checkForStaffAppointmentConflict
        }
        const newAppointment = await db.Appointment.create({
          date, time, staffId: parseInt(staffId), userId: userId ? parseInt(userId) : null,
          notes, status: userId ? (status || 'agendada') : (status || 'disponível'),
          durationMinutes: 60, // Adicionar duração ao criar
        });
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('Erro (admin) ao criar consulta:', error);
        if (error.name === 'SequelizeValidationError') { return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) }); }
        res.status(500).json({ message: 'Erro interno do servidor ao criar a consulta.', error: error.message });
    }
};

// @desc    Lista consultas com base no papel do requisitante
// @route   GET /api/appointments
// @access  Protegido
const getAllAppointments = async (req, res) => {
  const { staffId: queryStaffId, dateFrom, dateTo, status: queryStatus, userId: queryUserIdFromAdmin } = req.query;
  let whereClause = {};

  if (req.user && !req.staff) { // Cliente autenticado
    const clientId = req.user.id;
    whereClause = {
      [Op.or]: [
        { userId: clientId }, 
        { status: 'disponível', userId: null },
        { userId: clientId, status: 'pendente_aprovacao_staff' }
      ]
    };
    if (queryStaffId) { whereClause = { [Op.and]: [whereClause, { staffId: queryStaffId }] }; }
    if (queryStatus) { // Se cliente filtrar por status, aplica às suas consultas E mantém as disponíveis
        whereClause = { [Op.and]: [ {[Op.or]: whereClause[Op.or] }, { [Op.or]: [ { userId: clientId, status: queryStatus }, { status: 'disponível', userId: null } ]} ] };
    }
  } else if (req.staff) { // Staff/Admin autenticado
    if (req.staff.role === 'admin') {
        if (queryUserIdFromAdmin) whereClause.userId = queryUserIdFromAdmin;
        if (queryStaffId) whereClause.staffId = queryStaffId;
        if (queryStatus) whereClause.status = queryStatus;
    } else { // Staff não-admin
        whereClause = {
            [Op.or]: [
                { staffId: req.staff.id }, 
                { status: 'disponível', userId: null },
                { staffId: req.staff.id, status: 'pendente_aprovacao_staff' }
            ]
        };
        if (queryUserIdFromAdmin) { whereClause = { [Op.and]: [whereClause, { userId: queryUserIdFromAdmin }] }; }
        if (queryStatus) { whereClause = { [Op.and]: [whereClause, { status: queryStatus }] }; }
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

const getAppointmentById = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { id } = req.params;
    try {
        const appointment = await db.Appointment.findByPk(id, {
        include: [ { model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' } ],
        });
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' }); }
        // Adicionar lógica de permissão se necessário
        res.status(200).json(appointment);
    } catch (error) {
        console.error('Erro ao obter consulta por ID:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};
const adminUpdateAppointment = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { id } = req.params;
    const { date, time, staffId, userId, notes, status, durationMinutes } = req.body;
    try {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}
        // Atualizar campos
        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (durationMinutes) appointment.durationMinutes = parseInt(durationMinutes);
        if (notes !== undefined) appointment.notes = notes;
        if (status) {
            const allowedStatuses = db.Appointment.getAttributes().status.values;
            if (!allowedStatuses.includes(status)) { return res.status(400).json({ message: `Status inválido.` });}
            appointment.status = status;
        }
        if (staffId) {
            const professional = await db.Staff.findByPk(parseInt(staffId));
            if (!professional) return res.status(404).json({ message: 'Profissional não encontrado.' });
            appointment.staffId = parseInt(staffId);
        }
        if (userId === null || userId === '') {
            appointment.userId = null;
            if (!status || status === 'agendada') appointment.status = 'disponível';
        } else if (userId) {
            const clientUser = await db.User.findByPk(parseInt(userId));
            if (!clientUser) return res.status(404).json({ message: 'Cliente não encontrado.' });
            appointment.userId = parseInt(userId);
            if (!status || status === 'disponível') appointment.status = 'agendada';
        }
        await appointment.save();
        const updatedAppointment = await db.Appointment.findByPk(id, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Erro (admin) ao atualizar consulta:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};
const adminDeleteAppointment = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { id } = req.params;
    try {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}
        await appointment.destroy();
        res.status(200).json({ message: 'Consulta eliminada com sucesso.' });
    } catch (error) {
        console.error('Erro (admin) ao eliminar consulta:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};
const clientBookAppointment = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { appointmentId } = req.params;
    const userId = req.user.id;
    try {
        const appointment = await db.Appointment.findByPk(appointmentId);
        if (!appointment) { return res.status(404).json({ message: 'Horário de consulta não encontrado.' });}
        if (appointment.userId !== null) { return res.status(400).json({ message: 'Este horário já está ocupado.' });}
        if (appointment.status !== 'disponível') { return res.status(400).json({ message: 'Este horário não está disponível para marcação.' });}
        
        const clientOwnConflict = await db.Appointment.findOne({ where: { date: appointment.date, time: appointment.time, userId: userId, status: {[Op.ne]: 'cancelada_pelo_cliente'} }});
        if(clientOwnConflict) { return res.status(409).json({ message: 'Já tens outra consulta marcada para esta data e hora.' });}

        appointment.userId = userId;
        appointment.status = 'agendada';
        await appointment.save();
        const bookedAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
        res.status(200).json({ message: 'Consulta marcada com sucesso!', appointment: bookedAppointment });
    } catch (error) {
        console.error('Erro (cliente) ao marcar consulta:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};
const clientCancelAppointmentBooking = async (req, res) => { /* ... (código como na tua versão funcional) ... */ 
    const { appointmentId } = req.params;
    const userId = req.user.id;
    try {
        const appointment = await db.Appointment.findByPk(appointmentId);
        if (!appointment) { return res.status(404).json({ message: 'Consulta não encontrada.' });}
        if (appointment.userId !== userId) { return res.status(403).json({ message: 'Não tem permissão para cancelar esta consulta.' });}
        if (appointment.status !== 'agendada') { return res.status(400).json({ message: `Não é possível cancelar uma consulta com status '${appointment.status}'.`});}
        appointment.userId = null;
        appointment.status = 'disponível'; 
        await appointment.save();
        const cancelledAppointment = await db.Appointment.findByPk(appointmentId, { include: [{ model: db.User, as: 'client' }, { model: db.Staff, as: 'professional' }]});
        res.status(200).json({ message: 'Consulta cancelada com sucesso.', appointment: cancelledAppointment });
    } catch (error) {
        console.error('Erro (cliente) ao cancelar consulta:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};

// @desc    Cliente solicita uma nova consulta (fica pendente de aprovação do staff)
// @route   POST /api/appointments/request
// @access  Privado (Cliente)
const clientRequestAppointment = async (req, res) => {
  const { staffId, date, time, notes } = req.body;
  const userId = req.user.id;
  const durationMinutes = 60; // Duração padrão para consultas solicitadas

  if (!staffId || !date || !time) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: ID do profissional, data e hora.' });
  }
  if (isNaN(parseInt(staffId))) {
    return res.status(400).json({ message: 'ID do profissional deve ser um número.' });
  }

  try {
    const professional = await db.Staff.findByPk(parseInt(staffId));
    if (!professional || !['physiotherapist', 'trainer', 'admin'].includes(professional.role)) {
      return res.status(404).json({ message: 'Profissional não encontrado ou não habilitado para consultas.' });
    }

    // Verificar se o profissional já tem uma CONSULTA CONFLITUANTE
    const conflict = await checkForStaffAppointmentConflict(parseInt(staffId), date, time, durationMinutes);
    if (conflict) {
      return res.status(409).json({ message: `O profissional selecionado já tem uma consulta (${conflict.status}) das ${conflict.time.substring(0,5)} às ${new Date(new Date(`${conflict.date}T${conflict.time}Z`).getTime() + conflict.durationMinutes * 60000).toISOString().substring(11,16)} nesse dia. Por favor, escolha outro horário.` });
    }
    
    // Verificar se o cliente já tem outra consulta (não cancelada/rejeitada) no mesmo horário
    const clientOwnConflict = await db.Appointment.findOne({
        where: {
            userId,
            date,
            // Verificação de conflito de tempo para o cliente (simplificada, pode ser melhorada com duration)
            time: time, // Idealmente, verificar sobreposição com base na duração também
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
      durationMinutes,
      notes,
      status: 'pendente_aprovacao_staff',
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
// @route   PATCH /api/appointments/:appointmentId/respond
// @access  Privado (Staff - o profissional da consulta ou Admin)
const staffRespondToAppointmentRequest = async (req, res) => {
  const { appointmentId } = req.params;
  const { decision } // 'accept' ou 'reject'
    = req.body;
  const staffMemberId = req.staff.id; 

  if (!decision || !['accept', 'reject'].includes(decision)) {
    return res.status(400).json({ message: "Decisão inválida. Deve ser 'accept' ou 'reject'." });
  }

  try {
    const appointment = await db.Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Pedido de consulta não encontrado.' });
    }

    if (appointment.staffId !== staffMemberId && req.staff.role !== 'admin') {
      return res.status(403).json({ message: 'Não tem permissão para responder a este pedido.' });
    }

    if (appointment.status !== 'pendente_aprovacao_staff') {
      return res.status(400).json({ message: `Este pedido já foi processado (status atual: ${appointment.status}).` });
    }

    if (decision === 'accept') {
      const conflict = await checkForStaffAppointmentConflict(
        appointment.staffId, 
        appointment.date, 
        appointment.time, 
        appointment.durationMinutes,
        appointment.id // Exclui a própria consulta da verificação
      );
      if (conflict) {
        // Não altera o status, apenas informa o staff que há conflito.
        // O staff pode então rejeitar ou tentar resolver.
        return res.status(409).json({ 
            message: 'Conflito de horário detetado com outra consulta. Não é possível aprovar este pedido no momento.',
            conflictingAppointmentId: conflict.id
        });
      }
      appointment.status = 'agendada';
    } else { // decision === 'reject'
      appointment.status = 'rejeitada_pelo_staff';
    }

    await appointment.save();
    
    const updatedAppointment = await db.Appointment.findByPk(appointmentId, {
        include: [ {model: db.User, as: 'client'}, {model: db.Staff, as: 'professional'}]
    });

    res.status(200).json({ 
        message: `Pedido de consulta ${decision === 'accept' ? 'aceite e agendado' : 'rejeitado'} com sucesso.`, 
        appointment: updatedAppointment 
    });

  } catch (error) {
    console.error('Erro (staff) ao responder a pedido de consulta:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao responder ao pedido.', error: error.message });
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
};
