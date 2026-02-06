// backend/utils/emailService.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  FROM_EMAIL
} = process.env;

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: SMTP_SECURE === 'true' || false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendPasswordResetEmail(to, code) {
  const transport = getTransporter();
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2 style="color:#d4af37">Código de confirmação</h2>
      <p>Recebemos um pedido para alterar a sua palavra‑passe.</p>
      <p>Utilize o seguinte código para confirmar: <strong style="font-size:20px">${code}</strong></p>
      <p>Este código expira em 10 minutos.</p>
      <p>Se não foi você, ignore este email.</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Código para alterar palavra‑passe',
    html,
  });
}

/**
 * Envia alerta de erro crítico para administradores
 */
async function sendCriticalErrorAlert(errorLog) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Transporter não configurado, não é possível enviar alerta de erro crítico');
    return;
  }

  const adminEmails = process.env.ADMIN_ALERT_EMAILS?.split(',').map(e => e.trim()) || [];
  if (adminEmails.length === 0) {
    console.warn('ADMIN_ALERT_EMAILS não configurado, não é possível enviar alerta');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#e74c3c">🚨 ERRO CRÍTICO DETETADO</h2>
      <div style="background-color:#f8f9fa;padding:15px;border-radius:5px;margin:15px 0">
        <p><strong>ID do Log:</strong> ${errorLog.id}</p>
        <p><strong>Tipo:</strong> ${errorLog.errorType || 'N/A'}</p>
        <p><strong>Severidade:</strong> <span style="color:#e74c3c;font-weight:bold">${errorLog.severity || 'CRITICAL'}</span></p>
        <p><strong>Mensagem:</strong> ${errorLog.message || 'N/A'}</p>
        <p><strong>URL:</strong> ${errorLog.url || 'N/A'}</p>
        <p><strong>Data:</strong> ${errorLog.createdAt ? new Date(errorLog.createdAt).toLocaleString('pt-PT') : 'N/A'}</p>
        ${errorLog.userId ? `<p><strong>Utilizador ID:</strong> ${errorLog.userId}</p>` : ''}
      </div>
      ${errorLog.stackTrace ? `
        <details style="margin-top:15px">
          <summary style="cursor:pointer;font-weight:bold">Stack Trace</summary>
          <pre style="background-color:#2d2d2d;color:#f8f8f2;padding:15px;border-radius:5px;overflow-x:auto;font-size:12px">${errorLog.stackTrace}</pre>
        </details>
      ` : ''}
      <p style="margin-top:20px;color:#666;font-size:0.9em">
        Acede a <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/logs">/admin/logs</a> para mais detalhes.
      </p>
    </div>
  `;

  await transport.sendMail({
    to: adminEmails.join(','),
    from: FROM_EMAIL || SMTP_USER,
    subject: `🚨 ERRO CRÍTICO: ${errorLog.errorType || 'Erro'} - ${errorLog.message?.substring(0, 50) || 'Sem mensagem'}`,
    html,
  });
}

/**
 * Envia alerta de evento de segurança crítico para administradores
 */
async function sendCriticalSecurityAlert(securityLog) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Transporter não configurado, não é possível enviar alerta de segurança');
    return;
  }

  const adminEmails = process.env.ADMIN_ALERT_EMAILS?.split(',').map(e => e.trim()) || [];
  if (adminEmails.length === 0) {
    console.warn('ADMIN_ALERT_EMAILS não configurado, não é possível enviar alerta');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#e74c3c">🛡️ EVENTO DE SEGURANÇA CRÍTICO</h2>
      <div style="background-color:#f8f9fa;padding:15px;border-radius:5px;margin:15px 0">
        <p><strong>ID do Log:</strong> ${securityLog.id}</p>
        <p><strong>Tipo de Evento:</strong> ${securityLog.eventType || 'N/A'}</p>
        <p><strong>Severidade:</strong> <span style="color:#e74c3c;font-weight:bold">${securityLog.severity || 'CRITICAL'}</span></p>
        <p><strong>Descrição:</strong> ${securityLog.description || 'N/A'}</p>
        <p><strong>IP:</strong> ${securityLog.ipAddress || 'N/A'}</p>
        <p><strong>URL:</strong> ${securityLog.url || 'N/A'}</p>
        <p><strong>Data:</strong> ${securityLog.createdAt ? new Date(securityLog.createdAt).toLocaleString('pt-PT') : 'N/A'}</p>
        ${securityLog.userId ? `<p><strong>Utilizador ID:</strong> ${securityLog.userId}</p>` : ''}
        ${securityLog.attemptedRole ? `<p><strong>Role Tentado:</strong> ${securityLog.attemptedRole}</p>` : ''}
        ${securityLog.actualRole ? `<p><strong>Role Real:</strong> ${securityLog.actualRole}</p>` : ''}
      </div>
      <p style="margin-top:20px;color:#666;font-size:0.9em">
        Acede a <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/logs">/admin/logs</a> para mais detalhes.
      </p>
    </div>
  `;

  await transport.sendMail({
    to: adminEmails.join(','),
    from: FROM_EMAIL || SMTP_USER,
    subject: `🛡️ ALERTA DE SEGURANÇA: ${securityLog.eventType || 'Evento'} - ${securityLog.description?.substring(0, 50) || 'Sem descrição'}`,
    html,
  });
}

/**
 * Emails para visitantes (pedidos de consulta/treino sem conta)
 * Enviar em background; não bloquear a resposta da API.
 */

function _formatDatePt(dateStr, timeStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + (timeStr ? `T${timeStr}` : ''));
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' });
}

async function sendGuestAppointmentRequestReceived({ to, guestName, professionalName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Pedido de consulta recebido</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Recebemos o seu pedido de consulta com <strong>${professionalName || 'o profissional'}</strong> para <strong>${dateFormatted}</strong>.</p>
      <p>O seu pedido está pendente de confirmação. Será contactado assim que o profissional aprovar ou rejeitar.</p>
      <p>Obrigado,<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Pedido de consulta recebido - CORE',
    html,
  });
}

async function sendGuestAppointmentAccepted({ to, guestName, professionalName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#28a745">Consulta confirmada</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>O seu pedido de consulta foi <strong>aceite</strong>.</p>
      <p>Consulta com <strong>${professionalName || 'o profissional'}</strong> no dia <strong>${dateFormatted}</strong>.</p>
      <p>Se tiver sido informado de pagamento de sinal ou outras instruções, siga-as para confirmar a marcação.</p>
      <p>Obrigado,<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Consulta confirmada - CORE',
    html,
  });
}

async function sendGuestAppointmentRejected({ to, guestName, professionalName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#6c757d">Pedido de consulta não aceite</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Informamos que o seu pedido de consulta com <strong>${professionalName || 'o profissional'}</strong> para <strong>${dateFormatted}</strong> não pôde ser aceite.</p>
      <p>Pode efetuar um novo pedido para outra data ou profissional. Obrigado.</p>
      <p>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Pedido de consulta não aceite - CORE',
    html,
  });
}

async function sendGuestAppointmentTimeChanged({ to, guestName, professionalName, newDate, newTime }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(newDate, newTime);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Alteração de horário da sua consulta</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>A data ou hora da sua consulta foi alterada.</p>
      <p>Nova data e hora: <strong>${dateFormatted}</strong> com <strong>${professionalName || 'o profissional'}</strong>.</p>
      <p>Se tiver dúvidas, contacte-nos.</p>
      <p>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Alteração de horário da consulta - CORE',
    html,
  });
}

// --- Emails para treino experimental (visitante sem conta) ---

async function sendGuestTrainingRequestReceived({ to, guestName, trainingName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Inscrição em treino experimental recebida</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Recebemos a sua inscrição no treino <strong>${trainingName || 'experimental'}</strong> para <strong>${dateFormatted}</strong>.</p>
      <p>A inscrição está pendente de confirmação. Será contactado assim que o responsável aprovar ou rejeitar.</p>
      <p>Obrigado,<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Inscrição em treino experimental recebida - CORE',
    html,
  });
}

async function sendGuestTrainingAccepted({ to, guestName, trainingName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#28a745">Inscrição no treino confirmada</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>A sua inscrição no treino <strong>${trainingName || 'experimental'}</strong> foi <strong>aceite</strong>.</p>
      <p>Data e hora: <strong>${dateFormatted}</strong>.</p>
      <p>Até breve!<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Inscrição no treino confirmada - CORE',
    html,
  });
}

async function sendGuestTrainingRejected({ to, guestName, trainingName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#6c757d">Inscrição no treino não aceite</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Informamos que a sua inscrição no treino <strong>${trainingName || 'experimental'}</strong> para <strong>${dateFormatted}</strong> não pôde ser aceite.</p>
      <p>Pode inscrever-se noutro treino. Obrigado.</p>
      <p>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Inscrição no treino não aceite - CORE',
    html,
  });
}

async function sendGuestTrainingTimeChanged({ to, guestName, trainingName, newDate, newTime }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(newDate, newTime);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Alteração de horário do treino</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>A data ou hora do treino <strong>${trainingName || 'experimental'}</strong> foi alterada.</p>
      <p>Nova data e hora: <strong>${dateFormatted}</strong>.</p>
      <p>Se tiver dúvidas, contacte-nos.</p>
      <p>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Alteração de horário do treino - CORE',
    html,
  });
}

// --- Reagendamento: proposta (com botão confirmar) e confirmado ---

async function sendGuestAppointmentRescheduleProposed({ to, guestName, professionalName, proposedDate, proposedTime, confirmUrl }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(proposedDate, proposedTime);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Proposta de reagendamento da sua consulta</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Foi proposta uma nova data e hora para a sua consulta com <strong>${professionalName || 'o profissional'}</strong>:</p>
      <p style="font-size:1.1em;"><strong>${dateFormatted}</strong></p>
      <p>Clique no botão abaixo para confirmar esta alteração. Após confirmar, a sua consulta ficará agendada para esta nova data.</p>
      <p style="margin:24px 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#28a745;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Confirmar reagendamento</a>
      </p>
      <p style="color:#666;font-size:0.9em;">Se não confirmar, o pedido original mantém-se pendente. Este link expira em 7 dias.</p>
      <p>Obrigado,<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Proposta de reagendamento - Confirme a nova data - CORE',
    html,
  });
}

async function sendGuestAppointmentRescheduleConfirmed({ to, guestName, professionalName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#28a745">Reagendamento confirmado</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>O seu reagendamento foi confirmado. A sua consulta com <strong>${professionalName || 'o profissional'}</strong> está agendada para:</p>
      <p style="font-size:1.1em;"><strong>${dateFormatted}</strong></p>
      <p>Até breve!<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Reagendamento confirmado - CORE',
    html,
  });
}

async function sendGuestTrainingRescheduleProposed({ to, guestName, trainingName, proposedDate, proposedTime, confirmUrl }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(proposedDate, proposedTime);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#d4af37">Proposta de reagendamento do seu treino</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>Foi proposta uma nova data e hora para a sua inscrição no treino <strong>${trainingName || 'experimental'}</strong>:</p>
      <p style="font-size:1.1em;"><strong>${dateFormatted}</strong></p>
      <p>Clique no botão abaixo para confirmar esta alteração. Após confirmar, a sua inscrição ficará válida para esta nova data.</p>
      <p style="margin:24px 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#28a745;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Confirmar reagendamento</a>
      </p>
      <p style="color:#666;font-size:0.9em;">Se não confirmar, o pedido original mantém-se pendente. Este link expira em 7 dias.</p>
      <p>Obrigado,<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Proposta de reagendamento do treino - Confirme - CORE',
    html,
  });
}

async function sendGuestTrainingRescheduleConfirmed({ to, guestName, trainingName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2 style="color:#28a745">Reagendamento do treino confirmado</h2>
      <p>Olá ${guestName || 'Visitante'},</p>
      <p>O seu reagendamento foi confirmado. A sua inscrição no treino <strong>${trainingName || 'experimental'}</strong> está válida para:</p>
      <p style="font-size:1.1em;"><strong>${dateFormatted}</strong></p>
      <p>Até breve!<br/>Equipa CORE</p>
    </div>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Reagendamento do treino confirmado - CORE',
    html,
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendCriticalErrorAlert,
  sendCriticalSecurityAlert,
  sendGuestAppointmentRequestReceived,
  sendGuestAppointmentAccepted,
  sendGuestAppointmentRejected,
  sendGuestAppointmentTimeChanged,
  sendGuestTrainingRequestReceived,
  sendGuestTrainingAccepted,
  sendGuestTrainingRejected,
  sendGuestTrainingTimeChanged,
  sendGuestAppointmentRescheduleProposed,
  sendGuestAppointmentRescheduleConfirmed,
  sendGuestTrainingRescheduleProposed,
  sendGuestTrainingRescheduleConfirmed,
};