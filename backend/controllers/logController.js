// backend/controllers/logController.js
const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Importar emailService para alertas
let sendCriticalErrorAlert, sendCriticalSecurityAlert;
try {
  const emailService = require('../utils/emailService');
  sendCriticalErrorAlert = emailService.sendCriticalErrorAlert;
  sendCriticalSecurityAlert = emailService.sendCriticalSecurityAlert;
} catch (error) {
  logger.warn('emailService não encontrado ou funções de alerta não disponíveis');
  sendCriticalErrorAlert = async () => {
    logger.warn('sendCriticalErrorAlert chamado mas não está disponível');
  };
  sendCriticalSecurityAlert = async () => {
    logger.warn('sendCriticalSecurityAlert chamado mas não está disponível');
  };
}

// Importar Sentry para monitorização (opcional)
let sentryService;
try {
  sentryService = require('../utils/sentryService');
} catch (error) {
  logger.warn('sentryService não encontrado');
  sentryService = null;
}

/**
 * Regista um erro do frontend
 * POST /api/logs/error
 */
const logError = async (req, res) => {
  try {
    const {
      errorType = 'JS_ERROR',
      message,
      stackTrace,
      url,
      userAgent,
      deviceInfo,
      severity = 'MEDIUM',
      metadata,
    } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Mensagem de erro é obrigatória.' });
    }

    // Obter userId do token se disponível (não requer autenticação obrigatória)
    let userId = null;
    if (req.user) {
      userId = req.user.id;
    } else if (req.staff) {
      userId = req.staff.id;
    }

    const errorLog = await db.ErrorLog.create({
      userId,
      errorType,
      message,
      stackTrace,
      url,
      userAgent: userAgent || req.headers['user-agent'],
      deviceInfo,
      severity,
      metadata,
    });

    logger.error(`Erro registado: ${errorType} - ${message}`, { errorLogId: errorLog.id, userId });

    // Se for erro crítico, enviar alerta por email e Sentry
    if (severity === 'CRITICAL') {
      logger.error('ERRO CRÍTICO DETETADO:', { errorLogId: errorLog.id, message, stackTrace });
      
      // Enviar para Sentry (se configurado)
      if (sentryService && sentryService.isInitialized()) {
        sentryService.captureCriticalError(errorLog);
      }
      
      // Enviar email de alerta (em background, não bloquear resposta)
      sendCriticalErrorAlert(errorLog).catch(err => {
        logger.error('Erro ao enviar alerta de erro crítico:', err);
      });
    }

    res.status(201).json({ message: 'Erro registado com sucesso.', errorLogId: errorLog.id });
  } catch (error) {
    logger.error('Erro ao registar log de erro:', error);
    res.status(500).json({ message: 'Erro interno ao registar log.' });
  }
};

/**
 * Regista um evento de segurança
 * POST /api/logs/security
 */
const logSecurityEvent = async (req, res) => {
  try {
    const {
      eventType,
      description,
      attemptedRole,
      actualRole,
      severity = 'MEDIUM',
      metadata,
    } = req.body;

    if (!eventType || !description) {
      return res.status(400).json({ message: 'eventType e description são obrigatórios.' });
    }

    // Obter userId se disponível
    let userId = null;
    if (req.user) {
      userId = req.user.id;
    } else if (req.staff) {
      userId = req.staff.id;
    }

    // Obter IP do cliente (considera proxies)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] 
      || req.connection?.remoteAddress 
      || req.socket?.remoteAddress
      || req.ip
      || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const url = req.headers.referer || req.originalUrl || 'unknown';

    const securityLog = await db.SecurityLog.create({
      userId,
      eventType,
      description,
      attemptedRole,
      actualRole,
      ipAddress,
      userAgent,
      url,
      severity,
      metadata,
    });

    logger.warn(`Evento de segurança registado: ${eventType}`, { securityLogId: securityLog.id, userId, severity });

    // Se for evento crítico, enviar alerta por email e Sentry
    if (severity === 'CRITICAL') {
      logger.error('EVENTO DE SEGURANÇA CRÍTICO:', { securityLogId: securityLog.id, eventType, description });
      
      // Enviar para Sentry (se configurado)
      if (sentryService && sentryService.isInitialized()) {
        sentryService.captureCriticalSecurityEvent(securityLog);
      }
      
      // Enviar email de alerta (em background, não bloquear resposta)
      sendCriticalSecurityAlert(securityLog).catch(err => {
        logger.error('Erro ao enviar alerta de segurança crítico:', err);
      });
    }

    res.status(201).json({ message: 'Evento de segurança registado.', securityLogId: securityLog.id });
  } catch (error) {
    logger.error('Erro ao registar log de segurança:', error);
    res.status(500).json({ message: 'Erro interno ao registar log de segurança.' });
  }
};

/**
 * Obtém um log de erro por ID (apenas admin/staff)
 * GET /api/logs/errors/:id
 */
const getErrorLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const errorLog = await db.ErrorLog.findByPk(parseInt(id), {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });
    if (!errorLog) {
      return res.status(404).json({ message: 'Log de erro não encontrado.' });
    }
    res.status(200).json(errorLog);
  } catch (error) {
    logger.error('Erro ao obter log de erro por ID:', error);
    res.status(500).json({ message: 'Erro interno ao obter log.' });
  }
};

/**
 * Obtém logs de erro (apenas admin/staff)
 * GET /api/logs/errors
 */
const getErrorLogs = async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      severity,
      errorType,
      resolved,
      userId,
      startDate,
      endDate,
    } = req.query;

    const whereClause = {};

    if (severity) {
      whereClause.severity = severity;
    }

    if (errorType) {
      whereClause.errorType = errorType;
    }

    if (resolved !== undefined) {
      whereClause.resolved = resolved === 'true';
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await db.ErrorLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Estatísticas
    const stats = {
      total: count,
      bySeverity: await db.ErrorLog.count({
        where: whereClause,
        group: ['severity'],
        raw: true,
      }),
      byType: await db.ErrorLog.count({
        where: whereClause,
        group: ['errorType'],
        raw: true,
      }),
      unresolved: await db.ErrorLog.count({
        where: { ...whereClause, resolved: false },
      }),
    };

    res.status(200).json({
      logs: rows,
      total: count,
      stats,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    logger.error('Erro ao obter logs de erro:', error);
    res.status(500).json({ message: 'Erro interno ao obter logs.' });
  }
};

/**
 * Obtém logs de segurança (apenas admin/staff)
 * GET /api/logs/security
 */
const getSecurityLogs = async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      eventType,
      severity,
      userId,
      startDate,
      endDate,
    } = req.query;

    const whereClause = {};

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await db.SecurityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Estatísticas
    const stats = {
      total: count,
      bySeverity: await db.SecurityLog.count({
        where: whereClause,
        group: ['severity'],
        raw: true,
      }),
      byEventType: await db.SecurityLog.count({
        where: whereClause,
        group: ['eventType'],
        raw: true,
      }),
    };

    res.status(200).json({
      logs: rows,
      total: count,
      stats,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    logger.error('Erro ao obter logs de segurança:', error);
    res.status(500).json({ message: 'Erro interno ao obter logs de segurança.' });
  }
};

/**
 * Marca um erro como resolvido
 * PATCH /api/logs/errors/:logId/resolve
 */
const resolveErrorLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const staffId = req.staff?.id || req.user?.id;

    const errorLog = await db.ErrorLog.findByPk(logId);
    if (!errorLog) {
      return res.status(404).json({ message: 'Log de erro não encontrado.' });
    }

    errorLog.resolved = true;
    errorLog.resolvedAt = new Date();
    errorLog.resolvedBy = staffId;
    await errorLog.save();

    res.status(200).json({ message: 'Erro marcado como resolvido.', errorLog });
  } catch (error) {
    logger.error('Erro ao marcar log como resolvido:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar log.' });
  }
};

/**
 * Limpa logs antigos (mais de X dias)
 * @param {number} daysToKeep - Número de dias a manter (padrão: 90)
 */
const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Limpar logs de erro antigos (exceto críticos)
    const deletedErrors = await db.ErrorLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate,
        },
        severity: {
          [Op.ne]: 'CRITICAL', // Manter erros críticos
        },
      },
    });

    // Limpar logs de segurança antigos (exceto críticos e altos)
    const deletedSecurity = await db.SecurityLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate,
        },
        severity: {
          [Op.notIn]: ['CRITICAL', 'HIGH'], // Manter eventos críticos e altos
        },
      },
    });

    logger.info(`Limpeza de logs concluída: ${deletedErrors} erros e ${deletedSecurity} eventos de segurança removidos (mais antigos que ${daysToKeep} dias)`);
    
    return {
      deletedErrors,
      deletedSecurity,
      cutoffDate,
    };
  } catch (error) {
    logger.error('Erro ao limpar logs antigos:', error);
    throw error;
  }
};

/**
 * Exporta logs para CSV
 * @param {Array} logs - Array de logs
 * @param {string} type - 'errors' ou 'security'
 */
const exportLogsToCSV = (logs, type = 'errors') => {
  if (!logs || logs.length === 0) {
    return 'No logs to export';
  }

  const headers = type === 'errors' 
    ? ['ID', 'Data', 'Tipo', 'Mensagem', 'Severidade', 'Utilizador', 'URL', 'Resolvido', 'Data Resolução']
    : ['ID', 'Data', 'Tipo Evento', 'Descrição', 'Severidade', 'Utilizador', 'IP', 'URL'];

  const rows = logs.map(log => {
    if (type === 'errors') {
      return [
        log.id,
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.errorType || '',
        (log.message || '').replace(/"/g, '""'), // Escape quotes
        log.severity || '',
        log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.id})` : '',
        log.url || '',
        log.resolved ? 'Sim' : 'Não',
        log.resolvedAt ? new Date(log.resolvedAt).toISOString() : '',
      ];
    } else {
      return [
        log.id,
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.eventType || '',
        (log.description || '').replace(/"/g, '""'), // Escape quotes
        log.severity || '',
        log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.id})` : '',
        log.ipAddress || '',
        log.url || '',
      ];
    }
  });

  // Criar CSV
  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ];

  return csvRows.join('\n');
};

/**
 * Obtém estatísticas para gráficos
 */
const getLogsStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Erros por dia
    const errorsByDay = await db.ErrorLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [db.Sequelize.fn('DATE', db.Sequelize.col('createdAt')), 'date'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: [db.Sequelize.fn('DATE', db.Sequelize.col('createdAt'))],
      raw: true,
      order: [[db.Sequelize.fn('DATE', db.Sequelize.col('createdAt')), 'ASC']],
    });

    // Erros por tipo
    const errorsByType = await db.ErrorLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        'errorType',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: ['errorType'],
      raw: true,
    });

    // Erros por severidade
    const errorsBySeverity = await db.ErrorLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        'severity',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: ['severity'],
      raw: true,
    });

    // Eventos de segurança por dia
    const securityByDay = await db.SecurityLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [db.Sequelize.fn('DATE', db.Sequelize.col('createdAt')), 'date'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: [db.Sequelize.fn('DATE', db.Sequelize.col('createdAt'))],
      raw: true,
      order: [[db.Sequelize.fn('DATE', db.Sequelize.col('createdAt')), 'ASC']],
    });

    // Eventos de segurança por tipo
    const securityByType = await db.SecurityLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        'eventType',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
      ],
      group: ['eventType'],
      raw: true,
    });

    res.status(200).json({
      errorsByDay: errorsByDay.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0,
      })),
      errorsByType: errorsByType.map(item => ({
        type: item.errorType,
        count: parseInt(item.count) || 0,
      })),
      errorsBySeverity: errorsBySeverity.map(item => ({
        severity: item.severity,
        count: parseInt(item.count) || 0,
      })),
      securityByDay: securityByDay.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0,
      })),
      securityByType: securityByType.map(item => ({
        type: item.eventType,
        count: parseInt(item.count) || 0,
      })),
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de logs:', error);
    res.status(500).json({ message: 'Erro interno ao obter estatísticas.' });
  }
};

module.exports = {
  logError,
  logSecurityEvent,
  getErrorLogById,
  getErrorLogs,
  getSecurityLogs,
  resolveErrorLog,
  cleanupOldLogs,
  exportLogsToCSV,
  getLogsStats,
};
