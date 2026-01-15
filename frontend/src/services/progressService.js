// src/services/progressService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
logger.log('API_URL em uso no progressService:', API_URL); 


export const logExercisePerformanceService = async (performanceData, token) => {
  if (!token) throw new Error('Token não fornecido para logExercisePerformanceService.');
  if (!performanceData || !performanceData.workoutPlanId || !performanceData.planExerciseId || !performanceData.performedAt) {
  throw new Error('Dados obrigatórios em falta para registar desempenho (workoutPlanId, planExerciseId, performedAt).');
  }
  try {
    const url = `${API_URL}/progress/log-performance`;
    logger.log('logExercisePerformanceService URL:', url, 'Payload:', performanceData);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(performanceData),
    });
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de logExercisePerformanceService:", e);
      logger.error("Resposta recebida (texto) de logExercisePerformanceService:", responseText);
      throw new Error(`Resposta do servidor para log-performance não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de logExercisePerformanceService (status não OK):', data);
      throw new Error(data.message || `Erro ao registar desempenho do exercício. Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    logger.error("Erro em logExercisePerformanceService:", error);
    throw error;
  }
};


export const getMyPerformanceForWorkoutPlanService = async (trainingId, workoutPlanId, token) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceForWorkoutPlanService.');
  if (!trainingId || !workoutPlanId) throw new Error('ID do Treino e ID do Plano de Treino são obrigatórios.');
  try {
    const url = `${API_URL}/progress/my-history/training/${trainingId}/plan/${workoutPlanId}`;
    logger.log('getMyPerformanceForWorkoutPlanService URL:', url);
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de getMyPerformanceForWorkoutPlanService:", e);
      logger.error("Resposta recebida (texto) de getMyPerformanceForWorkoutPlanService:", responseText);
      throw new Error(`Resposta do servidor para my-history/training/... não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de getMyPerformanceForWorkoutPlanService (status não OK):', data);
      throw new Error(data.message || `Erro ao buscar histórico de desempenho do plano. Status: ${response.status}`);
    }
    return data; 
  } catch (error) {
    logger.error("Erro em getMyPerformanceForWorkoutPlanService:", error);
    if (error.message.toLowerCase().includes("unexpected token") || error.message.toLowerCase().includes("json.parse") || error.message.toLowerCase().includes("não é json válido")) {
        logger.error("Detalhe: A resposta do servidor para getMyPerformanceForWorkoutPlanService não foi JSON. Verifique o separador Network para ver a resposta HTML/texto do servidor, ou pode ser um erro na URL/endpoint.");
    }
    throw error;
  }
};


export const getMyPerformanceHistoryForExerciseService = async (planExerciseId, token, forPlaceholders = false, excludeTrainingId = null) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceHistoryForExerciseService.');
  if (!planExerciseId) throw new Error('ID do Exercício do Plano (planExerciseId) é obrigatório.');
  try {
    let url = `${API_URL}/progress/my-exercise-history/${planExerciseId}?limit=3`;
    if (forPlaceholders) {
      url += '&forPlaceholders=true';
    }
    if (excludeTrainingId) {
      url += `&excludeTrainingId=${excludeTrainingId}`;
    }
    logger.log('getMyPerformanceHistoryForExerciseService URL:', url); 
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de getMyPerformanceHistoryForExerciseService:", e);
      logger.error("Resposta recebida (texto) de getMyPerformanceHistoryForExerciseService:", responseText);
      throw new Error(`Resposta do servidor para my-exercise-history/... não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }
    
    if (!response.ok) {
      logger.error('Erro na resposta de getMyPerformanceHistoryForExerciseService (status não OK):', data);
      throw new Error(data.message || `Erro ao buscar histórico de desempenho do exercício. Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    logger.error("Erro em getMyPerformanceHistoryForExerciseService:", error);
    if (error.message.toLowerCase().includes("unexpected token") || error.message.toLowerCase().includes("json.parse") || error.message.toLowerCase().includes("não é json válido")) {
        logger.error("Detalhe: A resposta do servidor para getMyPerformanceHistoryForExerciseService não foi JSON. Verifique o separador Network para ver a resposta HTML/texto do servidor, ou pode ser um erro na URL/endpoint.");
    }
    throw error;
  }
};


export const deleteExercisePerformanceLogService = async (logId, token) => {
  if (!token) throw new Error('Token não fornecido para deleteExercisePerformanceLogService.');
  if (!logId) throw new Error('ID do Log é obrigatório para eliminar.');
  try {
    const url = `${API_URL}/progress/log/${logId}`; 
    logger.log('deleteExercisePerformanceLogService URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
   
    if (response.status === 204) { 
      return { message: 'Registo eliminado com sucesso.' };
    }

    const responseText = await response.text();
    if (responseText) {
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            logger.error("Falha ao fazer parse da resposta JSON de deleteExercisePerformanceLogService:", e);
            logger.error("Resposta recebida (texto) de deleteExercisePerformanceLogService:", responseText);
            if(response.ok) return { message: responseText || "Operação concluída (resposta não JSON)." };
            throw new Error(`Resposta do servidor para delete log não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0,200)}...`);
        }
        if (!response.ok) {
            logger.error('Erro na resposta de deleteExercisePerformanceLogService (status não OK):', data);
            throw new Error(data.message || `Erro ao eliminar registo. Status: ${response.status}`);
        }
        return data; 
    } else if (!response.ok) {
        throw new Error(`Erro ao eliminar registo. Status: ${response.status}. Nenhuma mensagem adicional do servidor.`);
    }
    return { message: 'Operação de eliminação processada pelo servidor.' };

  } catch (error) {
    logger.error("Erro em deleteExercisePerformanceLogService:", error);
    throw error;
  }
};

export const checkPersonalRecordsService = async (completedSets, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!completedSets || completedSets.length === 0) return { records: [] };
  
  try {
    const response = await fetch(`${API_URL}/progress/check-prs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(completedSets),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao verificar recordes pessoais.');
    }
    return data;
  } catch (error) {
    logger.error("Erro em checkPersonalRecordsService:", error);
    throw error;
  }
};

export const getMyRecordsService = async (token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/progress/my-records`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar recordes.');
    return data;
  } catch (error) {
    logger.error("Erro em getMyRecordsService:", error);
    throw error;
  }
};

export const updatePerformanceLogService = async (logId, performanceData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!logId) throw new Error('ID do Log é obrigatório para atualizar.');

  try {
    const response = await fetch(`${API_URL}/progress/log/${logId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(performanceData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar registo.');
    }
    return data;
  } catch (error) {
    logger.error("Erro em updatePerformanceLogService:", error);
    throw error;
  }
};

export const adminGetRecordsForUserService = async (userId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!userId) throw new Error('ID do Utilizador é obrigatório.');
  try {
    const response = await fetch(`${API_URL}/progress/admin/user-records/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar recordes do cliente.');
    return data;
  } catch (error) {
    logger.error("Erro em adminGetRecordsForUserService:", error);
    throw error;
  }
};

export const adminGetFullExerciseHistoryForUserService = async (userId, planExerciseId, token) => {
  if (!token || !userId || !planExerciseId) throw new Error('Token, UserID e PlanExerciseID são obrigatórios.');
  
  try {
    const response = await fetch(`${API_URL}/progress/admin/exercise-history/${userId}/${planExerciseId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar histórico de exercício para o cliente.');
    return data;
  } catch (error) {
    logger.error("Erro em adminGetFullExerciseHistoryForUserService:", error);
    throw error;
  }
};

export const updateExercisePerformanceService = async (performanceId, performanceData, token) => {
  try {
    const url = `${API_URL}/progress/log/${performanceId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(performanceData),
    });

    // O resto da lógica de tratamento da resposta pode ser mais simples
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Falha ao ler a resposta de erro.' }));
      throw new Error(errorData.message || 'Falha ao atualizar a performance do exercício.');
    }

    // Se o backend responder com 204 (No Content) ou um JSON, isto funciona
    if (response.status === 204) {
        return { success: true, performance: {} };
    }
    
    const updatedPerformance = await response.json();
    return { success: true, performance: updatedPerformance };

  } catch (error) {
    logger.error('Erro no serviço de atualização de performance:', error);
    throw error;
  }
};

export const getExerciseHistoryService = async (exerciseId, token, excludeTrainingId = null) => {
  if (!token) throw new Error('Token não fornecido para getExerciseHistoryService.');
  if (!exerciseId) throw new Error('ID do Exercício é obrigatório.');

  try {
    let url = `${API_URL}/progress/history/exercise/${exerciseId}?limit=3`;
    // Se excludeTrainingId for fornecido, adiciona à query string para excluir registos do treino atual
    if (excludeTrainingId) {
      url += `&excludeTrainingId=${excludeTrainingId}`;
    }
    
    const response = await fetch(url, {
      method: 'GET', // Método GET
      headers: {
        'Authorization': `Bearer ${token}`, // Envio do token de autorização
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar o histórico do exercício.');
    }
    return data;

  } catch (error) {
    logger.error("Erro em getExerciseHistoryService:", error);
    throw error;
  }
};

export const getMyLastPerformancesService = async (token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/progress/my-last-performances`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      // Evita rebentar o UI — devolve [] e deixa a página continuar
      logger.warn('getMyLastPerformancesService: resposta não OK', response.status);
      return [];
    }
    return data;
  } catch (error) {
    logger.error('Erro em getMyLastPerformancesService:', error);
    return [];
  }
};

// ========== TRAINING SESSION DRAFT SERVICES ==========

/**
 * Guarda ou atualiza um draft de sessão de treino no backend
 * @param {Object} workoutSession - Objeto com os dados do treino (activeWorkout)
 * @param {string} token - Token de autenticação
 * @returns {Promise<Object>} - Resposta do servidor com o draft guardado
 */
export const saveTrainingSessionDraftService = async (workoutSession, token) => {
  if (!token) throw new Error('Token não fornecido para saveTrainingSessionDraftService.');
  if (!workoutSession || !workoutSession.workoutPlanId || !workoutSession.startTime) {
    throw new Error('Dados obrigatórios em falta: workoutPlanId, startTime.');
  }

  try {
    const url = `${API_URL}/progress/training-session/draft`;
    const payload = {
      trainingId: workoutSession.trainingId || null,
      workoutPlanId: workoutSession.id || workoutSession.workoutPlanId,
      sessionData: {
        setsData: workoutSession.setsData || {},
        planExercises: workoutSession.planExercises || [],
        name: workoutSession.name,
        id: workoutSession.id,
      },
      startTime: workoutSession.startTime,
    };

    logger.log('saveTrainingSessionDraftService URL:', url, 'Payload:', payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de saveTrainingSessionDraftService:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de saveTrainingSessionDraftService (status não OK):', data);
      throw new Error(data.message || `Erro ao guardar draft. Status: ${response.status}`);
    }

    logger.log('Draft guardado com sucesso no backend:', data);
    return data;
  } catch (error) {
    logger.error("Erro em saveTrainingSessionDraftService:", error);
    throw error;
  }
};

/**
 * Obtém o draft de sessão de treino do utilizador
 * @param {string} token - Token de autenticação
 * @param {number|null} trainingId - ID do treino (opcional)
 * @param {number|null} workoutPlanId - ID do plano de treino (opcional)
 * @returns {Promise<Object|null>} - Draft encontrado ou null se não existir
 */
export const getTrainingSessionDraftService = async (token, trainingId = null, workoutPlanId = null, deviceId = null) => {
  if (!token) throw new Error('Token não fornecido para getTrainingSessionDraftService.');

  try {
    let url = `${API_URL}/progress/training-session/draft`;
    const params = new URLSearchParams();
    if (trainingId) params.append('trainingId', trainingId);
    if (workoutPlanId) params.append('workoutPlanId', workoutPlanId);
    if (deviceId) params.append('deviceId', deviceId);
    if (params.toString()) url += `?${params.toString()}`;

    logger.log('getTrainingSessionDraftService URL:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    
    // Se não encontrou (404), retornar null em vez de erro
    if (response.status === 404) {
      logger.log('Nenhum draft encontrado no backend');
      return null;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de getTrainingSessionDraftService:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de getTrainingSessionDraftService (status não OK):', data);
      throw new Error(data.message || `Erro ao obter draft. Status: ${response.status}`);
    }

    logger.log('Draft recuperado do backend:', data);
    return data.draft;
  } catch (error) {
    logger.error("Erro em getTrainingSessionDraftService:", error);
    // Retornar null em caso de erro para não quebrar o fluxo
    return null;
  }
};

/**
 * Elimina um draft de sessão de treino
 * @param {string} token - Token de autenticação
 * @param {number|null} draftId - ID do draft (opcional)
 * @param {number|null} trainingId - ID do treino (opcional, usado com workoutPlanId)
 * @param {number|null} workoutPlanId - ID do plano de treino (opcional, usado com trainingId)
 * @returns {Promise<Object>} - Resposta do servidor
 */
/**
 * Obtém histórico de todos os drafts do utilizador
 * @param {string} token - Token de autenticação
 * @param {number} limit - Limite de resultados (padrão: 20)
 * @param {number} offset - Offset para paginação (padrão: 0)
 * @returns {Promise<Object>} - Histórico de drafts
 */
export const getTrainingSessionDraftsHistoryService = async (token, limit = 20, offset = 0) => {
  if (!token) throw new Error('Token não fornecido para getTrainingSessionDraftsHistoryService.');

  try {
    const url = `${API_URL}/progress/training-session/drafts/history?limit=${limit}&offset=${offset}`;
    logger.log('getTrainingSessionDraftsHistoryService URL:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    
    if (response.status === 404) {
      return { drafts: [], expiredDrafts: [], total: 0, validCount: 0, expiredCount: 0 };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de getTrainingSessionDraftsHistoryService:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de getTrainingSessionDraftsHistoryService (status não OK):', data);
      throw new Error(data.message || `Erro ao obter histórico. Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    logger.error("Erro em getTrainingSessionDraftsHistoryService:", error);
    throw error;
  }
};

export const deleteTrainingSessionDraftService = async (token, draftId = null, trainingId = null, workoutPlanId = null) => {
  if (!token) throw new Error('Token não fornecido para deleteTrainingSessionDraftService.');
  if (!draftId && (!trainingId || !workoutPlanId)) {
    throw new Error('É necessário fornecer draftId ou trainingId + workoutPlanId.');
  }

  try {
    let url;
    if (draftId) {
      url = `${API_URL}/progress/training-session/draft/${draftId}`;
    } else {
      url = `${API_URL}/progress/training-session/draft?trainingId=${trainingId}&workoutPlanId=${workoutPlanId}`;
    }

    logger.log('deleteTrainingSessionDraftService URL:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseText = await response.text();
    let data;
    
    if (response.status === 204) {
      return { message: 'Draft eliminado com sucesso.' };
    }

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de deleteTrainingSessionDraftService:", e);
      if (response.ok) {
        return { message: responseText || "Operação concluída." };
      }
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro na resposta de deleteTrainingSessionDraftService (status não OK):', data);
      throw new Error(data.message || `Erro ao eliminar draft. Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    logger.error("Erro em deleteTrainingSessionDraftService:", error);
    throw error;
  }
};