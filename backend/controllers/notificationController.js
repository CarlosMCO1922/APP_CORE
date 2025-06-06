// backend/controllers/notificationController.js
const db = require('../models');
const { Op } = require('sequelize');


const createNotification = async (data) => {
    try {
    if (!data.recipientUserId && !data.recipientStaffId) {
      console.warn("Tentativa de criar notificação sem destinatário (User ou Staff).");
      return null;
    }
    if (!data.message) {
      console.warn("Tentativa de criar notificação sem mensagem.");
      return null;
    }
    const notification = await db.Notification.create(data);
    console.log(`Notificação ID ${notification.id} criada para ${data.recipientUserId ? 'User ' + data.recipientUserId : ''}${data.recipientStaffId ? 'Staff ' + data.recipientStaffId : ''}`);
    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação interna:', error);
    return null; 
  }
};


const getMyNotifications = async (req, res) => {
  const recipientId = req.user ? req.user.id : (req.staff ? req.staff.id : null);
  const recipientType = req.user ? 'user' : (req.staff ? 'staff' : null);

  if (!recipientId || !recipientType) {
    return res.status(401).json({ message: 'Utilizador não autenticado.' });
  }

  const { limit = 15, offset = 0, status } = req.query; 
  const whereClause = {};

  if (recipientType === 'user') {
    whereClause.recipientUserId = recipientId;
  } else { 
    whereClause.recipientStaffId = recipientId;
  }

  if (status === 'read') {
    whereClause.isRead = true;
  } else if (status === 'unread') {
    whereClause.isRead = false;
  }

  try {
    const { count, rows } = await db.Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    const unreadCount = await db.Notification.count({
        where: {
            ...whereClause, 
            isRead: false
        }
    });

    res.status(200).json({
      notifications: rows,
      totalNotifications: count,
      unreadCount: unreadCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar notificações.' });
  }
};


const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const recipientId = req.user ? req.user.id : (req.staff ? req.staff.id : null);
  const recipientType = req.user ? 'user' : (req.staff ? 'staff' : null);

  if (!recipientId) return res.status(401).json({ message: 'Utilizador não autenticado.' });

  try {
    const notification = await db.Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada.' });
    }

    // Verificar se a notificação pertence ao utilizador
    const belongsToUser = (recipientType === 'user' && notification.recipientUserId === recipientId) ||
                          (recipientType === 'staff' && notification.recipientStaffId === recipientId);

    if (!belongsToUser) {
      return res.status(403).json({ message: 'Não tem permissão para alterar esta notificação.' });
    }

    if (notification.isRead) {
      return res.status(200).json({ message: 'Notificação já estava marcada como lida.', notification });
    }

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ message: 'Notificação marcada como lida.', notification });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


const markAllAsRead = async (req, res) => {
  const recipientId = req.user ? req.user.id : (req.staff ? req.staff.id : null);
  const recipientType = req.user ? 'user' : (req.staff ? 'staff' : null);

  if (!recipientId) return res.status(401).json({ message: 'Utilizador não autenticado.' });

  const whereClause = { isRead: false };
  if (recipientType === 'user') {
    whereClause.recipientUserId = recipientId;
  } else {
    whereClause.recipientStaffId = recipientId;
  }

  try {
    const [updatedCount] = await db.Notification.update({ isRead: true }, {
      where: whereClause,
    });
    res.status(200).json({ message: `${updatedCount} notificações marcadas como lidas.` });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  _internalCreateNotification: createNotification
};