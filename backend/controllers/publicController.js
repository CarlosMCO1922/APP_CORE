// backend/controllers/publicController.js
// Rotas públicas (sem autenticação): pedidos de consulta e treino experimental por visitantes.
const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const { format } = require('date-fns');
const { checkForStaffAppointmentConflict } = require('./appointmentController');
const { _internalCreateNotification } = require('./notificationController');
const {
  sendGuestAppointmentRequestReceived,
} = require('../utils/emailService');

/** GET /public/staff-for-appointments - Lista profissionais que podem ter consultas (para dropdown público). */
const getStaffForAppointments = async (req, res) => {
  try {
    const staff = await db.Staff.findAll({
      where: { role: { [Op.in]: ['physiotherapist', 'trainer', 'admin'] } },
      attributes: ['id', 'firstName', 'lastName'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });
    res.status(200).json(staff);
  } catch (error) {
    console.error('Erro ao listar staff para consultas públicas:', error);
    res.status(500).json({ message: 'Erro ao listar profissionais.', error: error.message });
  }
};

/** GET /public/available-slots - Horários disponíveis para um profissional numa data (sem auth). */
const getAvailableSlots = async (req, res) => {
  const { date, staffId, durationMinutes } = req.query;
  if (!date || !staffId || !durationMinutes) {
    return res.status(400).json({ message: 'Data, ID do profissional e duração são obrigatórios.' });
  }
  const professionalId = parseInt(staffId, 10);
  const slotDuration = parseInt(durationMinutes, 10);
  if (isNaN(professionalId) || isNaN(slotDuration) || slotDuration <= 0) {
    return res.status(400).json({ message: 'Parâmetros inválidos.' });
  }
  try {
    const professional = await db.Staff.findByPk(professionalId);
    if (!professional || !['physiotherapist', 'trainer', 'admin'].includes(professional.role)) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }
    const workingHours = [
      { start: '10:00', end: '13:00' },
      { start: '15:00', end: '18:00' },
    ];
    const potentialSlots = [];
    workingHours.forEach((period) => {
      let currentTime = moment.utc(`${date}T${period.start}`);
      const endTime = moment.utc(`${date}T${period.end}`);
      while (currentTime.clone().add(slotDuration, 'minutes').isSameOrBefore(endTime)) {
        potentialSlots.push(currentTime.format('HH:mm'));
        currentTime.add(slotDuration, 'minutes');
      }
    });
    const existingAppointments = await db.Appointment.findAll({
      where: {
        staffId: professionalId,
        date,
        status: { [Op.notIn]: ['disponível', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff'] },
      },
      attributes: ['time', 'durationMinutes'],
    });
    const availableSlots = potentialSlots.filter((slot) => {
      const slotStart = moment.utc(`${date}T${slot}`);
      const slotEnd = slotStart.clone().add(slotDuration, 'minutes');
      return !existingAppointments.some((existing) => {
        const existingStart = moment.utc(`${date}T${existing.time}`);
        const existingEnd = existingStart.clone().add(existing.durationMinutes, 'minutes');
        return slotStart.isBefore(existingEnd) && slotEnd.isAfter(existingStart);
      });
    });
    res.status(200).json(availableSlots);
  } catch (error) {
    console.error('Erro ao obter slots públicos:', error);
    res.status(500).json({ message: 'Erro ao obter horários disponíveis.', error: error.message });
  }
};

/** POST /public/appointment-request - Pedido de consulta por visitante (nome, email, telemóvel obrigatórios). */
const postAppointmentRequest = async (req, res) => {
  const { staffId, date, time, durationMinutes = 60, notes, guestName, guestEmail, guestPhone } = req.body;

  if (!guestName || !guestEmail || !guestPhone) {
    return res.status(400).json({ message: 'Nome, email e telemóvel são obrigatórios.' });
  }
  const trimmedName = String(guestName).trim();
  const trimmedEmail = String(guestEmail).trim().toLowerCase();
  const trimmedPhone = String(guestPhone).trim();
  if (!trimmedName || !trimmedEmail || !trimmedPhone) {
    return res.status(400).json({ message: 'Nome, email e telemóvel não podem estar vazios.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ message: 'Email inválido.' });
  }

  if (!staffId || !date || !time) {
    return res.status(400).json({ message: 'Profissional, data e hora são obrigatórios.' });
  }
  const parsedStaffId = parseInt(staffId, 10);
  if (isNaN(parsedStaffId)) {
    return res.status(400).json({ message: 'ID do profissional inválido.' });
  }
  const parsedDuration = parseInt(durationMinutes, 10) || 60;
  if (parsedDuration <= 0) {
    return res.status(400).json({ message: 'Duração inválida.' });
  }

  try {
    const professional = await db.Staff.findByPk(parsedStaffId);
    if (!professional || !['physiotherapist', 'trainer', 'admin'].includes(professional.role)) {
      return res.status(404).json({ message: 'Profissional não encontrado.' });
    }

    const conflict = await checkForStaffAppointmentConflict(parsedStaffId, date, time, parsedDuration);
    if (conflict) {
      return res.status(409).json({ message: 'Este horário já não está disponível. Escolha outro.' });
    }

    const appointment = await db.Appointment.create({
      userId: null,
      staffId: parsedStaffId,
      date,
      time,
      durationMinutes: parsedDuration,
      notes: notes || null,
      status: 'pendente_aprovacao_staff',
      guestName: trimmedName,
      guestEmail: trimmedEmail,
      guestPhone: trimmedPhone,
    });

    const professionalName = `${professional.firstName} ${professional.lastName}`;

    _internalCreateNotification({
      recipientStaffId: parsedStaffId,
      message: `Novo pedido de consulta de ${trimmedName} (visitante) para ${format(new Date(date), 'dd/MM/yyyy')} às ${String(time).substring(0, 5)}.`,
      type: 'APPOINTMENT_REQUESTED_STAFF',
      relatedResourceId: appointment.id,
      relatedResourceType: 'appointment',
      link: '/admin/appointment-requests',
    });

    setImmediate(() => {
      sendGuestAppointmentRequestReceived({
        to: trimmedEmail,
        guestName: trimmedName,
        professionalName,
        date,
        time: String(time).substring(0, 5),
      }).catch((err) => console.error('Erro ao enviar email de pedido recebido:', err));
    });

    res.status(201).json({
      message: 'Pedido de consulta enviado com sucesso. Aguarde confirmação por parte do profissional.',
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('Erro ao criar pedido de consulta público:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ message: 'Erro ao enviar pedido.', error: error.message });
  }
};

module.exports = {
  getStaffForAppointments,
  getAvailableSlots,
  postAppointmentRequest,
};
