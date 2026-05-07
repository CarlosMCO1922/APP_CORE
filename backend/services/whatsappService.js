const logger = require('../utils/logger');

const META_GRAPH_VERSION = 'v22.0';

function normalizeE164(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Aceita +351..., 351..., 9...
  // Nota: Para robustez real convém uma lib (libphonenumber). Aqui mantemos simples.
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return `+${s.slice(2)}`;
  if (/^\d+$/.test(s)) return `+${s}`;
  return null;
}

function isConfigured() {
  return !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Envia mensagem WhatsApp (Cloud API).
 * IMPORTANTE: mensagens iniciadas pela empresa fora da janela 24h exigem templates aprovados.
 * Este método usa texto livre; se falhar em produção, migrar para template messages.
 */
async function sendWhatsAppText({ to, body }) {
  if (!isConfigured()) {
    logger.warn('WhatsApp não configurado (env META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID em falta).');
    return { ok: false, skipped: true };
  }

  const toE164 = normalizeE164(to);
  if (!toE164) {
    return { ok: false, skipped: true, reason: 'Número inválido (não E.164)' };
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: toE164,
    type: 'text',
    text: { body: String(body || '').slice(0, 4000) },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      logger.error('Falha ao enviar WhatsApp:', res.status, text);
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true, status: res.status, responseText: text };
  } catch (err) {
    logger.error('Erro ao enviar WhatsApp:', err);
    return { ok: false, error: err.message || String(err) };
  }
}

module.exports = {
  sendWhatsAppText,
};

