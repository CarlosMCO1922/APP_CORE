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

module.exports = { 
  sendPasswordResetEmail,
  sendCriticalErrorAlert,
  sendCriticalSecurityAlert,
};