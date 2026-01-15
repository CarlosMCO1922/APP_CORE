// backend/utils/websocketServer.js
// Servidor WebSocket para sincronização em tempo real de treinos
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('./logger');

let io = null;

/**
 * Inicializa o servidor WebSocket
 * @param {http.Server} server - Servidor HTTP do Express
 */
const initializeWebSocket = (server) => {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'https://app-core-frontend-wdvl.onrender.com,http://localhost:3000').split(',').map(o => o.trim());
  
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticação para WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Token de autenticação não fornecido'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // O JWT usa 'id' e não 'userId' (consistente com authMiddleware)
      const userId = decoded.id;
      const userRole = decoded.role;
      
      if (!userId || !userRole) {
        return next(new Error('Token inválido: id ou role ausentes'));
      }

      // Verificar se o utilizador existe na tabela correta (User ou Staff)
      let user = null;
      if (userRole === 'user') {
        user = await db.User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });
      } else if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(userRole)) {
        user = await db.Staff.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });
      }
      
      if (!user) {
        return next(new Error('Utilizador não encontrado'));
      }

      socket.userId = userId;
      socket.user = user;
      socket.userRole = userRole;
      next();
    } catch (error) {
      logger.error('Erro na autenticação WebSocket:', error);
      if (error.message.includes('jwt expired')) {
        return next(new Error('Token expirado'));
      }
      if (error.message.includes('jwt malformed') || error.message.includes('invalid token')) {
        return next(new Error('Token inválido'));
      }
      return next(new Error('Erro na autenticação'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Cliente WebSocket conectado: User ${userId}, Socket ${socket.id}`);

    // Juntar o utilizador à sua sala privada
    socket.join(`user:${userId}`);

    // Evento: Cliente quer sincronizar treino
    socket.on('workout:sync', async (data) => {
      try {
        const { workoutPlanId, trainingId, deviceId } = data;
        
        if (!workoutPlanId) {
          socket.emit('workout:sync:error', { message: 'workoutPlanId é obrigatório' });
          return;
        }

        logger.info(`Sincronização solicitada: User ${userId}, WorkoutPlan ${workoutPlanId}`);

        // Buscar draft do utilizador
        const draft = await db.TrainingSessionDraft.findOne({
          where: {
            userId,
            workoutPlanId: parseInt(workoutPlanId),
            trainingId: trainingId ? parseInt(trainingId) : null,
          },
        });

        if (draft && new Date(draft.expiresAt) >= new Date()) {
          // Notificar outros dispositivos do mesmo utilizador sobre a sincronização
          socket.to(`user:${userId}`).emit('workout:synced', {
            workoutPlanId: draft.workoutPlanId,
            trainingId: draft.trainingId,
            deviceId,
            timestamp: Date.now(),
          });

          // Enviar dados do draft para o cliente que solicitou
          socket.emit('workout:sync:success', {
            draft: {
              id: draft.id,
              trainingId: draft.trainingId,
              workoutPlanId: draft.workoutPlanId,
              sessionData: draft.sessionData,
              startTime: draft.startTime,
              updatedAt: draft.updatedAt,
            },
          });
        } else {
          socket.emit('workout:sync:notfound', { message: 'Nenhum draft encontrado' });
        }
      } catch (error) {
        logger.error('Erro ao sincronizar treino via WebSocket:', error);
        socket.emit('workout:sync:error', { message: 'Erro ao sincronizar treino' });
      }
    });

    // Evento: Cliente atualizou treino (notificar outros dispositivos)
    socket.on('workout:updated', async (data) => {
      try {
        const { workoutPlanId, trainingId, deviceId, setsData } = data;
        
        logger.info(`Treino atualizado: User ${userId}, WorkoutPlan ${workoutPlanId}`);

        // Notificar outros dispositivos do mesmo utilizador
        socket.to(`user:${userId}`).emit('workout:update:received', {
          workoutPlanId,
          trainingId,
          deviceId,
          setsData,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Erro ao notificar atualização de treino:', error);
      }
    });

    // Evento: Cliente terminou treino (notificar outros dispositivos)
    socket.on('workout:finished', async (data) => {
      try {
        const { workoutPlanId, trainingId, deviceId } = data;
        
        logger.info(`Treino terminado: User ${userId}, WorkoutPlan ${workoutPlanId}`);

        // Notificar outros dispositivos
        socket.to(`user:${userId}`).emit('workout:finished:received', {
          workoutPlanId,
          trainingId,
          deviceId,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Erro ao notificar término de treino:', error);
      }
    });

    // Evento: Desconexão
    socket.on('disconnect', () => {
      logger.info(`Cliente WebSocket desconectado: User ${userId}, Socket ${socket.id}`);
    });

    // Evento: Erro
    socket.on('error', (error) => {
      logger.error(`Erro no WebSocket: User ${userId}`, error);
    });
  });

  logger.info('Servidor WebSocket inicializado');
  return io;
};

/**
 * Obtém a instância do servidor WebSocket
 */
const getIO = () => {
  if (!io) {
    throw new Error('WebSocket server não foi inicializado. Chame initializeWebSocket primeiro.');
  }
  return io;
};

/**
 * Emite evento para um utilizador específico
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = {
  initializeWebSocket,
  getIO,
  emitToUser,
};
