const crypto = require('crypto');

function base64urlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input) {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, 'base64').toString('utf8');
}

function sign(payloadB64, secret) {
  return base64urlEncode(crypto.createHmac('sha256', secret).update(payloadB64).digest());
}

/**
 * Token assinado para checkout público (visitante) sem conta.
 * payload: { paymentId, exp, email? }
 */
function createPublicPaymentToken({ paymentId, email = null, ttlSeconds = 7 * 24 * 60 * 60 }) {
  const secret = process.env.PAYMENT_PUBLIC_TOKEN_SECRET;
  if (!secret) throw new Error('PAYMENT_PUBLIC_TOKEN_SECRET não está configurado.');
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = { paymentId: Number(paymentId), exp, email: email || undefined };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

function verifyPublicPaymentToken(token) {
  const secret = process.env.PAYMENT_PUBLIC_TOKEN_SECRET;
  if (!secret) throw new Error('PAYMENT_PUBLIC_TOKEN_SECRET não está configurado.');
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw new Error('Token inválido.');
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Assinatura inválida.');
  }
  const payload = JSON.parse(base64urlDecode(payloadB64));
  if (!payload?.paymentId) throw new Error('Token inválido (paymentId em falta).');
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token expirado.');
  return payload;
}

/**
 * Igual a createPublicPaymentToken, mas não rebenta o pedido HTTP se o segredo
 * não estiver configurado (ex.: deploy antigo). Regista aviso e devolve null.
 */
function tryCreatePublicPaymentToken(opts) {
  try {
    return createPublicPaymentToken(opts);
  } catch (e) {
    console.warn('[publicPaymentToken]', e.message || e);
    return null;
  }
}

module.exports = {
  createPublicPaymentToken,
  tryCreatePublicPaymentToken,
  verifyPublicPaymentToken,
};

