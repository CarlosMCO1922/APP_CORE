// frontend/src/services/sessionService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Criar uma nova sessão de treino ao finalizar
 */
export const createTrainingSessionService = async (sessionData, token) => {
  try {
    const url = `${API_URL}/sessions/create`;
    logger.log('createTrainingSessionService URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao criar sessão:', error.message);
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

    const url = `${API_URL}/sessions/history?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao obter histórico:', error.message);
    throw error;
  }
};

/**
 * Obter detalhes completos de uma sessão
 */
export const getSessionDetailsService = async (sessionId, token) => {
  try {
    const url = `${API_URL}/sessions/${sessionId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao obter detalhes da sessão:', error.message);
    throw error;
  }
};

/**
 * Obter última sessão de um plano específico (para placeholders)
 */
export const getLastSessionForPlanService = async (workoutPlanId, token) => {
  try {
    const url = `${API_URL}/sessions/last-for-plan/${workoutPlanId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // 404 é normal se não houver sessão anterior
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao obter última sessão:', error.message);
    throw error;
  }
};

/**
 * Atualizar notas/metadata de uma sessão
 */
export const updateSessionService = async (sessionId, updates, token) => {
  try {
    const url = `${API_URL}/sessions/${sessionId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao atualizar sessão:', error.message);
    throw error;
  }
};

/**
 * Eliminar uma sessão
 */
export const deleteSessionService = async (sessionId, token, permanent = false) => {
  try {
    const url = `${API_URL}/sessions/${sessionId}?permanent=${permanent}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao eliminar sessão:', error.message);
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

    const url = `${API_URL}/sessions/stats?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sessionService] Erro ao obter estatísticas:', error.message);
    throw error;
  }
};
