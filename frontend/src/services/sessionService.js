// frontend/src/services/sessionService.js
import { apiClient } from './apiClient';

const BASE_URL = '/sessions';

/**
 * Criar uma nova sessão de treino ao finalizar
 */
export const createTrainingSessionService = async (sessionData, token) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/create`,
      sessionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao criar sessão:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Obter histórico de sessões
 */
export const getSessionsHistoryService = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.workoutPlanId) queryParams.append('workoutPlanId', params.workoutPlanId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get(
      `${BASE_URL}/history?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao obter histórico:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Obter detalhes completos de uma sessão
 */
export const getSessionDetailsService = async (sessionId, token) => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao obter detalhes da sessão:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Obter última sessão de um plano específico (para placeholders)
 */
export const getLastSessionForPlanService = async (workoutPlanId, token) => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}/last-for-plan/${workoutPlanId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    // 404 é normal se não houver sessão anterior
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('[sessionService] Erro ao obter última sessão:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Atualizar notas/metadata de uma sessão
 */
export const updateSessionService = async (sessionId, updates, token) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/${sessionId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao atualizar sessão:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Eliminar uma sessão
 */
export const deleteSessionService = async (sessionId, token, permanent = false) => {
  try {
    const response = await apiClient.delete(
      `${BASE_URL}/${sessionId}?permanent=${permanent}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao eliminar sessão:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Obter estatísticas de sessões
 */
export const getSessionStatsService = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.workoutPlanId) queryParams.append('workoutPlanId', params.workoutPlanId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(
      `${BASE_URL}/stats?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[sessionService] Erro ao obter estatísticas:', error?.response?.data || error.message);
    throw error;
  }
};
