const db = require('../models');
const { format } = require('date-fns');
const { trainingStartMillis } = require('../utils/trainingScheduleTime');
const { sendWhatsAppText } = require('../services/whatsappService');

/**
 * Envia lembrete 24h antes para consultas confirmadas.
 * Janela: envia se start estiver entre (24h - 10min) e (24h + 10min).
 */
async function runAppointment24hReminders() {
  const now = Date.now();
  const target = now + 24 * 60 * 60 * 1000;
  const windowMs = 10 * 60 * 1000;

  const appointments = await db.Appointment.findAll({
    where: {
      status: 'confirmada',
      reminder24hSentAt: null,
    },
    include: [{ model: db.User, as: 'client', attributes: ['id', 'firstName', 'phone'] }],
    order: [['date', 'ASC'], ['time', 'ASC']],
    limit: 200,
  });

  for (const appt of appointments) {
    const ms = trainingStartMillis(appt.date, appt.time);
    if (Number.isNaN(ms)) continue;
    if (ms < target - windowMs || ms > target + windowMs) continue;

    const phone = appt.client?.phone;
    if (!phone) {
      appt.reminder24hSentAt = new Date();
      await appt.save();
      continue;
    }

    const timeStr = String(appt.time).substring(0, 5);
    const body =
      `Lembrete: tens uma consulta amanhã (${format(new Date(appt.date), 'dd/MM/yyyy')}) às ${timeStr}.`;

    const sent = await sendWhatsAppText({ to: phone, body });
    if (sent.ok || sent.skipped) {
      appt.reminder24hSentAt = new Date();
      await appt.save();
    }
  }
}

module.exports = {
  runAppointment24hReminders,
};

