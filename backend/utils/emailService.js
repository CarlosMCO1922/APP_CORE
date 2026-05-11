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

const _emailStyles = {
  wrapper: 'max-width:560px;margin:0 auto;font-family:"Segoe UI",Arial,sans-serif;background:#f8f9fa;padding:32px 20px;',
  card: 'background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;',
  header: 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#d4af37;padding:28px 24px;text-align:center;',
  headerTitle: 'margin:0;font-size:1.5rem;font-weight:700;letter-spacing:0.02em;',
  body: 'padding:28px 24px;color:#333;line-height:1.7;font-size:16px;',
  highlight: 'background:#f0f7ff;border-left:4px solid #d4af37;padding:14px 16px;margin:20px 0;border-radius:0 8px 8px 0;',
  button: 'display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;box-shadow:0 4px 14px rgba(40,167,69,0.4);',
  footer: 'padding:20px 24px;text-align:center;color:#6c757d;font-size:13px;border-top:1px solid #eee;',
  amountRow: 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;',
};

/** Email único: pedido de consulta pendente (cliente com conta ou visitante). Design moderno. */
async function sendAppointmentRequestPending({ to, clientName, professionalName, date, time }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;">
  <div style="${_emailStyles.wrapper}">
    <div style="${_emailStyles.card}">
      <div style="${_emailStyles.header}">
        <h1 style="${_emailStyles.headerTitle}">Pedido de consulta recebido</h1>
        <p style="margin:8px 0 0 0;font-size:0.95rem;opacity:0.95;">CORE · A sua marcação está em análise</p>
      </div>
      <div style="${_emailStyles.body}">
        <p>Olá <strong>${clientName || 'Visitante'}</strong>,</p>
        <p>Recebemos o seu pedido de consulta e agradecemos a sua preferência.</p>
        <div style="${_emailStyles.highlight}">
          <p style="margin:0 0 6px 0;font-size:0.9rem;color:#666;">Resumo do pedido</p>
          <p style="margin:0;font-size:1.1rem;"><strong>${professionalName || 'Profissional'}</strong></p>
          <p style="margin:4px 0 0 0;font-size:1.05rem;color:#1a1a2e;">📅 ${dateFormatted}</p>
        </div>
        <p><strong>Estado atual:</strong> Pendente de confirmação pelo profissional.</p>
        <p>Será contactado por email assim que o profissional aprovar ou rejeitar o pedido. Se tiver dúvidas, contacte-nos.</p>
      </div>
      <div style="${_emailStyles.footer}">
        Obrigado,<br/><strong>Equipa CORE</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Pedido de consulta recebido – Pendente de confirmação | CORE',
    html,
  });
}

/** Compatível com o nome antigo (visitante). */
async function sendGuestAppointmentRequestReceived({ to, guestName, professionalName, date, time }) {
  return sendAppointmentRequestPending({ to, clientName: guestName, professionalName, date, time });
}

/**
 * Email: consulta aceite pelo profissional.
 * Se totalCost, signalAmount e paymentUrl forem passados, inclui bloco de pagamento do sinal (25%) com botão.
 */
async function sendGuestAppointmentAccepted({ to, guestName, professionalName, date, time, totalCost, signalAmount, paymentUrl }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const hasPayment = paymentUrl && totalCost != null && signalAmount != null && Number(signalAmount) > 0;
  const totalFormatted = totalCost != null ? `€ ${Number(totalCost).toFixed(2).replace('.', ',')}` : '';
  const signalFormatted = signalAmount != null ? `€ ${Number(signalAmount).toFixed(2).replace('.', ',')}` : '';

  const paymentBlock = hasPayment ? `
        <div style="margin:24px 0;padding:20px;background:#f8fff9;border:1px solid #c3e6cb;border-radius:8px;">
          <p style="margin:0 0 12px 0;font-weight:600;color:#155724;">Pagamento do sinal (25%)</p>
          <p style="margin:0 0 8px 0;font-size:0.95rem;">Valor total da consulta: <strong>${totalFormatted}</strong></p>
          <p style="margin:0 0 16px 0;font-size:0.95rem;">Sinal a pagar agora (25%): <strong>${signalFormatted}</strong></p>
          <p style="margin:0 0 12px 0;font-size:0.9rem;color:#555;">Para confirmar a sua marcação, efetue o pagamento do sinal através do botão abaixo. Após o pagamento, a consulta ficará confirmada.</p>
          <a href="${paymentUrl}" style="${_emailStyles.button}">Pagar sinal (${signalFormatted})</a>
        </div>` : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;">
  <div style="${_emailStyles.wrapper}">
    <div style="${_emailStyles.card}">
      <div style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:#fff;padding:28px 24px;text-align:center;">
        <h1 style="margin:0;font-size:1.5rem;font-weight:700;">Consulta aceite</h1>
        <p style="margin:8px 0 0 0;font-size:0.95rem;opacity:0.95;">A sua marcação foi confirmada pelo profissional</p>
      </div>
      <div style="${_emailStyles.body}">
        <p>Olá <strong>${guestName || 'Visitante'}</strong>,</p>
        <p>Boa notícia: o profissional aceitou o seu pedido de consulta.</p>
        <div style="${_emailStyles.highlight}">
          <p style="margin:0 0 6px 0;font-size:0.9rem;color:#666;">Horário confirmado</p>
          <p style="margin:0;font-size:1.1rem;"><strong>${professionalName || 'Profissional'}</strong></p>
          <p style="margin:4px 0 0 0;font-size:1.05rem;color:#1a1a2e;">📅 ${dateFormatted}</p>
        </div>
        ${paymentBlock}
        <p style="margin-top:20px;">Até breve!<br/>Equipa CORE</p>
      </div>
      <div style="${_emailStyles.footer}">
        Obrigado,<br/><strong>Equipa CORE</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Consulta aceite – Horário confirmado | CORE',
    html,
  });
}

/**
 * Email: pagamento do sinal confirmado e consulta confirmada.
 */
async function sendAppointmentSignalPaidConfirmed({ to, clientName, professionalName, date, time, signalAmount }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const signalFormatted = signalAmount != null ? `€ ${Number(signalAmount).toFixed(2).replace('.', ',')}` : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;">
  <div style="${_emailStyles.wrapper}">
    <div style="${_emailStyles.card}">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#d4af37;padding:28px 24px;text-align:center;">
        <h1 style="${_emailStyles.headerTitle}">Pagamento confirmado</h1>
        <p style="margin:8px 0 0 0;font-size:0.95rem;opacity:0.95;">A sua consulta ficou confirmada</p>
      </div>
      <div style="${_emailStyles.body}">
        <p>Olá <strong>${clientName || 'Cliente'}</strong>,</p>
        <p>Recebemos o seu pagamento do sinal <strong>${signalFormatted}</strong>. A sua consulta está agora <strong>CONFIRMADA</strong>.</p>
        <div style="${_emailStyles.highlight}">
          <p style="margin:0 0 6px 0;font-size:0.9rem;color:#666;">Detalhes</p>
          <p style="margin:0;font-size:1.1rem;"><strong>${professionalName || 'Profissional'}</strong></p>
          <p style="margin:4px 0 0 0;font-size:1.05rem;color:#1a1a2e;">📅 ${dateFormatted}</p>
        </div>
        <p>Obrigado!<br/>Equipa CORE</p>
      </div>
      <div style="${_emailStyles.footer}">
        Obrigado,<br/><strong>Equipa CORE</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Pagamento confirmado – Consulta confirmada | CORE',
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

/**
 * Email quando um admin cria uma consulta e atribui ao cliente.
 */
async function sendAppointmentCreatedByAdmin({ to, clientName, professionalName, date, time, totalCost, signalAmount, paymentUrl }) {
  const transport = getTransporter();
  if (!transport || !SMTP_USER) return;
  const dateFormatted = _formatDatePt(date, time);
  const hasPayment = paymentUrl && totalCost != null && signalAmount != null && Number(signalAmount) > 0;
  const totalFormatted = totalCost != null ? `€ ${Number(totalCost).toFixed(2).replace('.', ',')}` : '';
  const signalFormatted = signalAmount != null ? `€ ${Number(signalAmount).toFixed(2).replace('.', ',')}` : '';

  const paymentBlock = hasPayment ? `
        <div style="margin:24px 0;padding:20px;background:#f8fff9;border:1px solid #c3e6cb;border-radius:8px;">
          <p style="margin:0 0 12px 0;font-weight:600;color:#155724;">Pagamento do sinal (25%)</p>
          <p style="margin:0 0 8px 0;font-size:0.95rem;">Valor total da consulta: <strong>${totalFormatted}</strong></p>
          <p style="margin:0 0 16px 0;font-size:0.95rem;">Sinal a pagar agora (25%): <strong>${signalFormatted}</strong></p>
          <p style="margin:0 0 12px 0;font-size:0.9rem;color:#555;">Para confirmar a sua marcação, efetue o pagamento do sinal através do botão abaixo. Após o pagamento, a consulta ficará confirmada.</p>
          <a href="${paymentUrl}" style="${_emailStyles.button}">Pagar sinal (${signalFormatted})</a>
        </div>` : '';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;">
  <div style="${_emailStyles.wrapper}">
    <div style="${_emailStyles.card}">
      <div style="${_emailStyles.header}">
        <h1 style="${_emailStyles.headerTitle}">Nova consulta agendada</h1>
        <p style="margin:8px 0 0 0;font-size:0.95rem;opacity:0.95;">CORE · Foi agendada uma consulta para si</p>
      </div>
      <div style="${_emailStyles.body}">
        <p>Olá <strong>${clientName || 'Cliente'}</strong>,</p>
        <p>Informamos que foi agendada uma nova consulta para si.</p>
        <div style="${_emailStyles.highlight}">
          <p style="margin:0 0 6px 0;font-size:0.9rem;color:#666;">Resumo</p>
          <p style="margin:0;font-size:1.1rem;"><strong>${professionalName || 'Profissional'}</strong></p>
          <p style="margin:4px 0 0 0;font-size:1.05rem;color:#1a1a2e;">📅 ${dateFormatted}</p>
        </div>
        ${paymentBlock}
        <p>Se tiver dúvidas ou precisar de alterar o horário, contacte-nos.</p>
      </div>
      <div style="${_emailStyles.footer}">Obrigado,<br/><strong>Equipa CORE</strong></div>
    </div>
  </div>
</body>
</html>`;
  await transport.sendMail({
    to,
    from: FROM_EMAIL || SMTP_USER,
    subject: 'Nova consulta agendada para si | CORE',
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
  sendAppointmentRequestPending,
  sendGuestAppointmentRequestReceived,
  sendGuestAppointmentAccepted,
  sendAppointmentSignalPaidConfirmed,
  sendGuestAppointmentRejected,
  sendGuestAppointmentTimeChanged,
  sendAppointmentCreatedByAdmin,
  sendGuestTrainingRequestReceived,
  sendGuestTrainingAccepted,
  sendGuestTrainingRejected,
  sendGuestTrainingTimeChanged,
  sendGuestAppointmentRescheduleProposed,
  sendGuestAppointmentRescheduleConfirmed,
  sendGuestTrainingRescheduleProposed,
  sendGuestTrainingRescheduleConfirmed,
};