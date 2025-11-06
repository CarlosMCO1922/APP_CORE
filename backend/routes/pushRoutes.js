// backend/routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const { sendPush } = require('../utils/pushService');

router.post('/schedule', async (req, res) => {
  try {
    const { subscription, delaySeconds = 30, title = 'Notificação', body = '' } = req.body || {};
    if (!subscription) return res.status(400).json({ message: 'subscription é obrigatório' });
    const delay = Math.max(0, parseInt(delaySeconds, 10) || 0) * 1000;

    setTimeout(() => {
      sendPush(subscription, { title, body, tag: 'rest-timer' }).catch(() => {});
    }, delay);

    res.json({ ok: true, scheduledInMs: delay });
  } catch (e) {
    console.error('Erro /push/schedule:', e);
    res.status(500).json({ message: 'Falha a agendar push' });
  }
});

module.exports = router;