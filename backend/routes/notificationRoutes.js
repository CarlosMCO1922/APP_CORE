// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Aplicar middleware de proteção a todas as rotas de notificação
router.use(protect);

router.get('/my-notifications', getMyNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/mark-all-as-read', markAllAsRead);

module.exports = router;