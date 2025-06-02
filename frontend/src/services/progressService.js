// src/services/progressService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; // O seu URL base da API
console.log('API_URL em uso no progressService:', API_URL); // Para depuração

/**
 * Regista o desempenho de um cliente num exercício específico.
 * @param {object} performanceData - Dados do desempenho.
 * @param {string} token - Token de autenticação do cliente.
 * @returns {Promise<object>} - A resposta da API.
 */
export const logExercisePerformanceService = async (performanceData, token) => {
  if (!token) throw new Error('Token não fornecido para logExercisePerformanceService.');
  if (!performanceData || !performanceData.trainingId || !performanceData.workoutPlanId || !performanceData.planExerciseId || !performanceData.performedAt) {
    throw new Error('Dados obrigatórios em falta para registar desempenho (trainingId, workoutPlanId, planExerciseId, performedAt).');
  }
  try {
    const url = `${API_URL}/progress/log-performance`;
    console.log('logExercisePerformanceService URL:', url, 'Payload:', performanceData); // Para depuração
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
      console.error("Falha ao fazer parse da resposta JSON de logExercisePerformanceService:", e);
      console.error("Resposta recebida (texto) de logExercisePerformanceService:", responseText);
      throw new Error(`Resposta do servidor para log-performance não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      console.error('Erro na resposta de logExercisePerformanceService (status não OK):', data);
      throw new Error(data.message || `Erro ao registar desempenho do exercício. Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error("Erro em logExercisePerformanceService:", error);
    throw error;
  }
};

/**
 * Obtém o histórico de desempenho de um cliente para um plano de treino específico dentro de um treino.
 * @param {number|string} trainingId - ID do treino.
 * @param {number|string} workoutPlanId - ID do plano de treino.
 * @param {string} token - Token de autenticação do cliente.
 * @returns {Promise<Array>} - Array com os registos de desempenho.
 */
export const getMyPerformanceForWorkoutPlanService = async (trainingId, workoutPlanId, token) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceForWorkoutPlanService.');
  if (!trainingId || !workoutPlanId) throw new Error('ID do Treino e ID do Plano de Treino são obrigatórios.');
  try {
    const url = `${API_URL}/progress/my-history/training/${trainingId}/plan/${workoutPlanId}`;
    console.log('getMyPerformanceForWorkoutPlanService URL:', url); // Para depuração
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Falha ao fazer parse da resposta JSON de getMyPerformanceForWorkoutPlanService:", e);
      console.error("Resposta recebida (texto) de getMyPerformanceForWorkoutPlanService:", responseText);
      throw new Error(`Resposta do servidor para my-history/training/... não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      console.error('Erro na resposta de getMyPerformanceForWorkoutPlanService (status não OK):', data);
      throw new Error(data.message || `Erro ao buscar histórico de desempenho do plano. Status: ${response.status}`);
    }
    return data; 
  } catch (error) {
    console.error("Erro em getMyPerformanceForWorkoutPlanService:", error);
    if (error.message.toLowerCase().includes("unexpected token") || error.message.toLowerCase().includes("json.parse") || error.message.toLowerCase().includes("não é json válido")) {
        console.error("Detalhe: A resposta do servidor para getMyPerformanceForWorkoutPlanService não foi JSON. Verifique o separador Network para ver a resposta HTML/texto do servidor, ou pode ser um erro na URL/endpoint.");
    }
    throw error;
  }
};

/**
 * Obtém o histórico de desempenho de um cliente para um exercício específico de um plano (WorkoutPlanExercise) ao longo do tempo.
 * @param {number|string} planExerciseId - ID do WorkoutPlanExercise.
 * @param {string} token - Token de autenticação do cliente.
 * @returns {Promise<Array>} - Array com os registos de desempenho.
 */
export const getMyPerformanceHistoryForExerciseService = async (planExerciseId, token) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceHistoryForExerciseService.');
  if (!planExerciseId) throw new Error('ID do Exercício do Plano (planExerciseId) é obrigatório.');
  try {
    const url = `${API_URL}/progress/my-exercise-history/${planExerciseId}`;
    console.log('getMyPerformanceHistoryForExerciseService URL:', url); // Para depuração
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Falha ao fazer parse da resposta JSON de getMyPerformanceHistoryForExerciseService:", e);
      console.error("Resposta recebida (texto) de getMyPerformanceHistoryForExerciseService:", responseText);
      throw new Error(`Resposta do servidor para my-exercise-history/... não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0, 200)}...`);
    }
    
    if (!response.ok) {
      console.error('Erro na resposta de getMyPerformanceHistoryForExerciseService (status não OK):', data);
      throw new Error(data.message || `Erro ao buscar histórico de desempenho do exercício. Status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error("Erro em getMyPerformanceHistoryForExerciseService:", error);
    if (error.message.toLowerCase().includes("unexpected token") || error.message.toLowerCase().includes("json.parse") || error.message.toLowerCase().includes("não é json válido")) {
        console.error("Detalhe: A resposta do servidor para getMyPerformanceHistoryForExerciseService não foi JSON. Verifique o separador Network para ver a resposta HTML/texto do servidor, ou pode ser um erro na URL/endpoint.");
    }
    throw error;
  }
};

/**
 * Elimina um registo de desempenho de exercício específico.
 * @param {number|string} logId - ID do registo de desempenho a ser eliminado.
 * @param {string} token - Token de autenticação do cliente.
 * @returns {Promise<object>} - A resposta da API.
 */
export const deleteExercisePerformanceLogService = async (logId, token) => {
  if (!token) throw new Error('Token não fornecido para deleteExercisePerformanceLogService.');
  if (!logId) throw new Error('ID do Log é obrigatório para eliminar.');
  try {
    const url = `${API_URL}/progress/log/${logId}`; // Confirme se este é o seu endpoint DELETE no backend
    console.log('deleteExercisePerformanceLogService URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Muitos backends retornam 204 No Content para DELETEs bem-sucedidos e não têm corpo na resposta.
    if (response.status === 204) { 
      return { message: 'Registo eliminado com sucesso.' };
    }

    const responseText = await response.text();
    // Se houver um corpo na resposta (ex: uma mensagem de sucesso ou erro em JSON)
    if (responseText) {
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Falha ao fazer parse da resposta JSON de deleteExercisePerformanceLogService:", e);
            console.error("Resposta recebida (texto) de deleteExercisePerformanceLogService:", responseText);
            // Se não for JSON, mas a resposta for ok (ex: 200 com texto), pode tratar de forma diferente
            if(response.ok) return { message: responseText || "Operação concluída (resposta não JSON)." };
            throw new Error(`Resposta do servidor para delete log não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0,200)}...`);
        }
        if (!response.ok) {
            console.error('Erro na resposta de deleteExercisePerformanceLogService (status não OK):', data);
            throw new Error(data.message || `Erro ao eliminar registo. Status: ${response.status}`);
        }
        return data; // Espera-se { message: 'Registo eliminado com sucesso.' } ou similar
    } else if (!response.ok) {
        // Se não houver corpo e a resposta não for OK.
        throw new Error(`Erro ao eliminar registo. Status: ${response.status}. Nenhuma mensagem adicional do servidor.`);
    }
    
    // Se chegou aqui, pode ser uma resposta OK sem corpo, mas não 204 (ex: 200 OK sem corpo)
    return { message: 'Operação de eliminação processada pelo servidor.' };

  } catch (error) {
    console.error("Erro em deleteExercisePerformanceLogService:", error);
    throw error;
  }
};