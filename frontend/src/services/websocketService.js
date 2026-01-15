// frontend/src/services/websocketService.js
import { io } from 'socket.io-client';
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Conecta ao servidor WebSocket
 * @param {string} token - Token de autenticação
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {Socket} - Instância do socket
 */
export const connectWebSocket = (token, callbacks = {}) => {
  if (socket && socket.connected) {
    logger.log('WebSocket já conectado');
    return socket;
  }

  if (!token) {
    logger.warn('Token não fornecido para WebSocket');
    return null;
  }

  try {
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    socket.on('connect', () => {
      logger.log('WebSocket conectado');
      reconnectAttempts = 0;
      if (callbacks.onConnect) callbacks.onConnect();
    });

    socket.on('disconnect', (reason) => {
      logger.warn('WebSocket desconectado:', reason);
      if (callbacks.onDisconnect) callbacks.onDisconnect(reason);
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts++;
      logger.error('Erro na conexão WebSocket:', error);
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger.error('Máximo de tentativas de reconexão atingido');
        if (callbacks.onMaxReconnectAttempts) callbacks.onMaxReconnectAttempts();
      }
      if (callbacks.onError) callbacks.onError(error);
    });

    // Evento: Treino foi sincronizado noutro dispositivo
    socket.on('workout:synced', (data) => {
      logger.log('Treino sincronizado noutro dispositivo:', data);
      if (callbacks.onWorkoutSynced) callbacks.onWorkoutSynced(data);
    });

    // Evento: Treino foi atualizado noutro dispositivo
    socket.on('workout:update:received', (data) => {
      logger.log('Atualização de treino recebida:', data);
      if (callbacks.onWorkoutUpdated) callbacks.onWorkoutUpdated(data);
    });

    // Evento: Treino foi terminado noutro dispositivo
    socket.on('workout:finished:received', (data) => {
      logger.log('Treino terminado noutro dispositivo:', data);
      if (callbacks.onWorkoutFinished) callbacks.onWorkoutFinished(data);
    });

    // Evento: Resposta de sincronização bem-sucedida
    socket.on('workout:sync:success', (data) => {
      logger.log('Sincronização bem-sucedida:', data);
      if (callbacks.onSyncSuccess) callbacks.onSyncSuccess(data);
    });

    // Evento: Erro na sincronização
    socket.on('workout:sync:error', (error) => {
      logger.error('Erro na sincronização:', error);
      if (callbacks.onSyncError) callbacks.onSyncError(error);
    });

    // Evento: Draft não encontrado
    socket.on('workout:sync:notfound', (data) => {
      logger.warn('Draft não encontrado:', data);
      if (callbacks.onSyncNotFound) callbacks.onSyncNotFound(data);
    });

    return socket;
  } catch (error) {
    logger.error('Erro ao criar conexão WebSocket:', error);
    return null;
  }
};

/**
 * Desconecta do servidor WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.log('WebSocket desconectado');
  }
};

/**
 * Solicita sincronização de treino
 * @param {number} workoutPlanId - ID do plano de treino
 * @param {number|null} trainingId - ID do treino (opcional)
 * @param {string} deviceId - ID do dispositivo
 */
export const requestWorkoutSync = (workoutPlanId, trainingId = null, deviceId = null) => {
  if (!socket || !socket.connected) {
    logger.warn('WebSocket não conectado, não é possível sincronizar');
    return;
  }

  const deviceIdToUse = deviceId || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  socket.emit('workout:sync', {
    workoutPlanId,
    trainingId,
    deviceId: deviceIdToUse,
  });

  logger.log('Solicitação de sincronização enviada:', { workoutPlanId, trainingId, deviceId: deviceIdToUse });
};

/**
 * Notifica outros dispositivos sobre atualização de treino
 * @param {number} workoutPlanId - ID do plano de treino
 * @param {number|null} trainingId - ID do treino (opcional)
 * @param {string} deviceId - ID do dispositivo
 * @param {Object} setsData - Dados das séries atualizadas
 */
export const notifyWorkoutUpdate = (workoutPlanId, trainingId = null, deviceId, setsData) => {
  if (!socket || !socket.connected) {
    logger.warn('WebSocket não conectado, não é possível notificar atualização');
    return;
  }

  socket.emit('workout:updated', {
    workoutPlanId,
    trainingId,
    deviceId,
    setsData,
  });

  logger.log('Notificação de atualização enviada:', { workoutPlanId, trainingId, deviceId });
};

/**
 * Notifica outros dispositivos sobre término de treino
 * @param {number} workoutPlanId - ID do plano de treino
 * @param {number|null} trainingId - ID do treino (opcional)
 * @param {string} deviceId - ID do dispositivo
 */
export const notifyWorkoutFinished = (workoutPlanId, trainingId = null, deviceId) => {
  if (!socket || !socket.connected) {
    logger.warn('WebSocket não conectado, não é possível notificar término');
    return;
  }

  socket.emit('workout:finished', {
    workoutPlanId,
    trainingId,
    deviceId,
  });

  logger.log('Notificação de término enviada:', { workoutPlanId, trainingId, deviceId });
};

/**
 * Verifica se o WebSocket está conectado
 */
export const isWebSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Obtém o ID do dispositivo atual (ou gera um novo)
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};
