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
  sendGuestAppointmentRescheduleConfirmed,
  sendGuestTrainingRescheduleConfirmed,
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
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;

  const buildList = (trainings, guestCountByTraining, getParticipantsCount, getInstructor) => {
    return trainings.map((t) => {
      const participantsCount = getParticipantsCount(t) + (guestCountByTraining[t.id] || 0);
      const start = new Date(`${t.date}T${String(t.time).substring(0, 5)}`);
      const signupsClosed = !isNaN(start.getTime()) && start.getTime() - now < oneHourMs;
      const instructor = getInstructor(t);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        date: t.date,
        time: String(t.time).substring(0, 5),
        durationMinutes: t.durationMinutes,
        capacity: t.capacity,
        participantsCount,
        hasVacancies: participantsCount < t.capacity && !signupsClosed,
        instructor: instructor ? { id: instructor.id, firstName: instructor.firstName, lastName: instructor.lastName } : null,
      };
    });
  };

  try {
    const trainings = await db.Training.findAll({
      where: { date: { [Op.gte]: today } },
      include: [
        { model: db.Staff, as: 'instructor', required: false, attributes: ['id', 'firstName', 'lastName'] },
        { model: db.User, as: 'participants', attributes: ['id'], through: { attributes: [] }, required: false },
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
    const list = buildList(
      trainings,
      guestCountByTraining,
      (t) => t.participants?.length || 0,
      (t) => t.instructor || null
    );
    return res.status(200).json(list);
  } catch (error) {
    console.error('Erro ao listar treinos públicos (query completa):', error.message || error);
    try {
      const trainings = await db.Training.findAll({
        where: { date: { [Op.gte]: today } },
        attributes: ['id', 'name', 'description', 'date', 'time', 'durationMinutes', 'capacity', 'instructorId'],
        order: [['date', 'ASC'], ['time', 'ASC']],
      });
      if (trainings.length === 0) return res.status(200).json([]);
      const trainingIds = trainings.map((t) => t.id);
      const [guestSignups, instructors] = await Promise.all([
        db.TrainingGuestSignup.findAll({
          where: { status: 'APPROVED', trainingId: trainingIds },
          attributes: ['trainingId'],
        }),
        db.Staff.findAll({
          where: { id: [...new Set(trainings.map((t) => t.instructorId).filter(Boolean))] },
          attributes: ['id', 'firstName', 'lastName'],
        }),
      ]);
      const guestCountByTraining = guestSignups.reduce((acc, g) => {
        acc[g.trainingId] = (acc[g.trainingId] || 0) + 1;
        return acc;
      }, {});
      const instructorById = (instructors || []).reduce((acc, i) => { acc[i.id] = i; return acc; }, {});
      const participantCounts = await Promise.all(
        trainings.map((t) => (t.countParticipants ? t.countParticipants() : Promise.resolve(0)))
      ).catch(() => trainingIds.map(() => 0));
      const countByTid = (Array.isArray(participantCounts) ? participantCounts : trainingIds.map(() => 0)).reduce(
        (acc, n, i) => { acc[trainingIds[i]] = n; return acc; },
        {}
      );
      const list = buildList(
        trainings,
        guestCountByTraining,
        (t) => countByTid[t.id] || 0,
        (t) => (t.instructorId ? instructorById[t.instructorId] : null)
      );
      return res.status(200).json(list);
    } catch (fallbackError) {
      console.error('Erro ao listar treinos públicos (fallback):', fallbackError.message || fallbackError);
      return res.status(200).json([]);
    }
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

    const trainingStart = new Date(`${training.date}T${String(training.time).substring(0, 5)}`);
    if (!isNaN(trainingStart.getTime()) && trainingStart.getTime() - Date.now() < 60 * 60 * 1000) {
      return res.status(400).json({
        message: 'As inscrições fecham 1 hora antes do início do treino. Já não é possível inscrever-se neste horário.',
      });
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

/** GET /public/confirm-appointment-reschedule?token= - Cliente/visitante confirma reagendamento da consulta (link do email). */
const confirmAppointmentReschedule = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token de confirmação em falta.' });
  }

  try {
    const proposal = await db.AppointmentRescheduleProposal.findOne({
      where: { token },
      include: [
        { model: db.Appointment, as: 'appointment', include: [{ model: db.Staff, as: 'professional' }, { model: db.User, as: 'client', attributes: ['email', 'firstName', 'lastName'] }] },
      ],
    });
    if (!proposal) return res.status(404).json({ message: 'Proposta de reagendamento não encontrada.' });
    if (proposal.usedAt) return res.status(400).json({ message: 'Este reagendamento já foi confirmado.' });
    if (new Date() > new Date(proposal.expiresAt)) return res.status(400).json({ message: 'O link de confirmação expirou.' });

    const appointment = proposal.appointment;
    appointment.date = proposal.proposedDate;
    appointment.time = proposal.proposedTime;
    appointment.status = 'agendada';
    await appointment.save();

    proposal.usedAt = new Date();
    await proposal.save();

    const professionalName = appointment.professional ? `${appointment.professional.firstName} ${appointment.professional.lastName}` : 'o profissional';
    const guestName = appointment.guestName || (appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : null) || 'Visitante';
    const to = appointment.guestEmail || (appointment.client && appointment.client.email) || null;
    if (to && sendGuestAppointmentRescheduleConfirmed) {
      setImmediate(() => {
        sendGuestAppointmentRescheduleConfirmed({
          to,
          guestName,
          professionalName,
          date: appointment.date,
          time: String(appointment.time).substring(0, 5),
        }).catch(err => console.error('Erro ao enviar email de reagendamento confirmado:', err));
      });
    }

    res.status(200).json({
      message: 'Reagendamento confirmado com sucesso. A sua consulta foi atualizada para a nova data e hora.',
      appointment: { id: appointment.id, date: appointment.date, time: String(appointment.time).substring(0, 5) },
    });
  } catch (error) {
    console.error('Erro ao confirmar reagendamento de consulta:', error);
    res.status(500).json({ message: 'Erro ao confirmar reagendamento.', error: error.message });
  }
};

/** GET /public/confirm-training-reschedule?token= - Visitante confirma reagendamento do treino (link do email). */
const confirmTrainingReschedule = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token de confirmação em falta.' });
  }

  try {
    const signup = await db.TrainingGuestSignup.findOne({
      where: { rescheduleToken: token },
      include: [
        { model: db.Training, as: 'training' },
        { model: db.Training, as: 'proposedTraining' },
      ],
    });
    if (!signup) return res.status(404).json({ message: 'Proposta de reagendamento não encontrada.' });
    if (signup.status !== 'RESCHEDULE_PROPOSED') return res.status(400).json({ message: 'Esta proposta já foi processada.' });
    if (!signup.rescheduleTokenExpiresAt || new Date() > new Date(signup.rescheduleTokenExpiresAt)) {
      return res.status(400).json({ message: 'O link de confirmação expirou.' });
    }

    const newTraining = signup.proposedTraining;
    if (!newTraining) return res.status(400).json({ message: 'Treino proposto não encontrado.' });

    await db.TrainingGuestSignup.create({
      trainingId: newTraining.id,
      guestName: signup.guestName,
      guestEmail: signup.guestEmail,
      guestPhone: signup.guestPhone,
      status: 'APPROVED',
      staffApprovedById: signup.staffApprovedById,
    });

    signup.status = 'REJECTED';
    signup.rescheduleToken = null;
    signup.rescheduleTokenExpiresAt = null;
    signup.proposedTrainingId = null;
    await signup.save();

    if (sendGuestTrainingRescheduleConfirmed) {
      setImmediate(() => {
        sendGuestTrainingRescheduleConfirmed({
          to: signup.guestEmail,
          guestName: signup.guestName || 'Visitante',
          trainingName: newTraining.name || 'treino',
          date: newTraining.date,
          time: String(newTraining.time).substring(0, 5),
        }).catch(err => console.error('Erro ao enviar email de reagendamento treino confirmado:', err));
      });
    }

    res.status(200).json({
      message: 'Reagendamento confirmado com sucesso. A sua inscrição está válida para a nova data.',
      training: { id: newTraining.id, name: newTraining.name, date: newTraining.date, time: String(newTraining.time).substring(0, 5) },
    });
  } catch (error) {
    console.error('Erro ao confirmar reagendamento de treino:', error);
    res.status(500).json({ message: 'Erro ao confirmar reagendamento.', error: error.message });
  }
};

module.exports = {
  getStaffForAppointments,
  getAvailableSlots,
  postAppointmentRequest,
  getPublicTrainings,
  postGuestTrainingSignup,
  confirmAppointmentReschedule,
  confirmTrainingReschedule,
};
