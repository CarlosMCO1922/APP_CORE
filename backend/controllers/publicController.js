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
  sendGuestTrainingRequestReceived,
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

/** GET /public/trainings - Lista treinos futuros para a página de treino experimental (sem auth). */
const getPublicTrainings = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const trainings = await db.Training.findAll({
      where: { date: { [Op.gte]: today } },
      include: [
        { model: db.Staff, as: 'instructor', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.User, as: 'participants', attributes: ['id'], through: { attributes: [] } },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    const trainingIds = trainings.map((t) => t.id);
    const guestSignups = trainingIds.length
      ? await db.TrainingGuestSignup.findAll({
          where: { status: 'APPROVED', trainingId: trainingIds },
          attributes: ['trainingId'],
        })
      : [];
    const guestCountByTraining = guestSignups.reduce((acc, g) => {
      acc[g.trainingId] = (acc[g.trainingId] || 0) + 1;
      return acc;
    }, {});
    const list = trainings.map((t) => {
      const participantsCount = (t.participants?.length || 0) + (guestCountByTraining[t.id] || 0);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        date: t.date,
        time: String(t.time).substring(0, 5),
        durationMinutes: t.durationMinutes,
        capacity: t.capacity,
        participantsCount,
        hasVacancies: participantsCount < t.capacity,
        instructor: t.instructor ? { id: t.instructor.id, firstName: t.instructor.firstName, lastName: t.instructor.lastName } : null,
      };
    });
    res.status(200).json(list);
  } catch (error) {
    console.error('Erro ao listar treinos públicos:', error);
    res.status(500).json({ message: 'Erro ao listar treinos.', error: error.message });
  }
};

/** POST /public/trainings/:trainingId/guest-signup - Inscrição de visitante num treino experimental (sem auth). */
const postGuestTrainingSignup = async (req, res) => {
  const { trainingId } = req.params;
  const { guestName, guestEmail, guestPhone } = req.body;

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

  const tid = parseInt(trainingId, 10);
  if (isNaN(tid)) {
    return res.status(400).json({ message: 'ID do treino inválido.' });
  }

  try {
    const training = await db.Training.findByPk(tid, {
      include: [{ model: db.Staff, as: 'instructor', attributes: ['id', 'firstName', 'lastName'] }],
    });
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    if (training.date < today) {
      return res.status(400).json({ message: 'Não é possível inscrever-se num treino já realizado.' });
    }

    const existing = await db.TrainingGuestSignup.findOne({
      where: { trainingId: tid, guestEmail: trimmedEmail },
    });
    if (existing) {
      return res.status(409).json({ message: 'Já existe uma inscrição com este email neste treino.' });
    }

    const participantsCount = await training.countParticipants();
    const approvedGuests = await db.TrainingGuestSignup.count({
      where: { trainingId: tid, status: 'APPROVED' },
    });
    if (participantsCount + approvedGuests >= training.capacity) {
      return res.status(409).json({ message: 'Este treino já está completo.' });
    }

    const signup = await db.TrainingGuestSignup.create({
      trainingId: tid,
      guestName: trimmedName,
      guestEmail: trimmedEmail,
      guestPhone: trimmedPhone,
      status: 'PENDING_APPROVAL',
    });

    const instructorName = training.instructor ? `${training.instructor.firstName} ${training.instructor.lastName}` : 'o instrutor';
    _internalCreateNotification({
      recipientStaffId: training.instructorId,
      message: `Nova inscrição de visitante (${trimmedName}) no treino "${training.name}" para ${format(new Date(training.date), 'dd/MM/yyyy')} às ${String(training.time).substring(0, 5)}.`,
      type: 'NEW_TRAINING_ASSIGNED',
      relatedResourceId: training.id,
      relatedResourceType: 'training',
      link: '/admin/manage-trainings',
    });

    setImmediate(() => {
      sendGuestTrainingRequestReceived({
        to: trimmedEmail,
        guestName: trimmedName,
        trainingName: training.name,
        date: training.date,
        time: String(training.time).substring(0, 5),
      }).catch((err) => console.error('Erro ao enviar email de inscrição treino:', err));
    });

    res.status(201).json({
      message: 'Inscrição enviada com sucesso. Aguarde confirmação por parte do responsável.',
      signupId: signup.id,
    });
  } catch (error) {
    console.error('Erro ao criar inscrição de visitante no treino:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map((e) => e.message) });
    }
    res.status(500).json({ message: 'Erro ao enviar inscrição.', error: error.message });
  }
};

module.exports = {
  getStaffForAppointments,
  getAvailableSlots,
  postAppointmentRequest,
  getPublicTrainings,
  postGuestTrainingSignup,
};
