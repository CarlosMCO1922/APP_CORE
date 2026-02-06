// backend/routes/logRoutes.js
const express = require('express');
const router = express.Router();
const {
  logError,
  logSecurityEvent,
  getErrorLogById,
  getErrorLogs,
  getSecurityLogs,
  resolveErrorLog,
  exportLogsToCSV,
  getLogsStats,
} = require('../controllers/logController');
const { protect, optionalProtect, isStaff } = require('../middleware/authMiddleware');

// Frontend envia erros aqui; auth opcional para associar userId quando o utilizador está logado
router.post('/error', optionalProtect, logError);
router.post('/security', protect, logSecurityEvent); // Requer autenticação

// Rotas protegidas (apenas staff/admin)
router.get('/errors', protect, isStaff, getErrorLogs);
router.get('/errors/:id', protect, isStaff, getErrorLogById);
router.get('/security', protect, isStaff, getSecurityLogs);
router.patch('/errors/:logId/resolve', protect, isStaff, resolveErrorLog);
router.get('/stats', protect, isStaff, getLogsStats);
router.get('/export/errors', protect, isStaff, async (req, res) => {
  try {
    const { limit = 10000, offset = 0, ...filters } = req.query;
    
    // Obter logs usando a mesma lógica de getErrorLogs mas sem enviar resposta
    const db = require('../models');
    const { Op } = require('sequelize');
    
    const whereClause = {};
    if (filters.severity) whereClause.severity = filters.severity;
    if (filters.errorType) whereClause.errorType = filters.errorType;
    if (filters.resolved !== undefined) whereClause.resolved = filters.resolved === 'true';
    if (filters.userId) whereClause.userId = parseInt(filters.userId);
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const logs = await db.ErrorLog.findAll({
      where: whereClause,
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    const csv = exportLogsToCSV(logs, 'errors');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=error_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao exportar logs.' });
  }
});

router.get('/export/security', protect, isStaff, async (req, res) => {
  try {
    const { limit = 10000, offset = 0, ...filters } = req.query;
    
    // Obter logs usando a mesma lógica de getSecurityLogs mas sem enviar resposta
    const db = require('../models');
    const { Op } = require('sequelize');
    
    const whereClause = {};
    if (filters.eventType) whereClause.eventType = filters.eventType;
    if (filters.severity) whereClause.severity = filters.severity;
    if (filters.userId) whereClause.userId = parseInt(filters.userId);
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const logs = await db.SecurityLog.findAll({
      where: whereClause,
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    const csv = exportLogsToCSV(logs, 'security');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao exportar logs de segurança.' });
  }
});

module.exports = router;
