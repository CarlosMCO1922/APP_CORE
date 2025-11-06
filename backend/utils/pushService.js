// backend/utils/pushService.js
const webpush = require('web-push');

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT
} = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('VAPID keys missing. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the environment.');
}

webpush.setVapidDetails(
  VAPID_SUBJECT || 'mailto:admin@example.com',
  VAPID_PUBLIC_KEY || '','
  VAPID_PRIVATE_KEY || ''
);

async function sendPush(subscription, payload) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return webpush.sendNotification(subscription, data).catch(err => {
    console.error('Erro ao enviar push:', err && err.body ? err.body : err);
    throw err;
  });
}

module.exports = { sendPush };