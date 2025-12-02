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

module.exports = { sendPasswordResetEmail };