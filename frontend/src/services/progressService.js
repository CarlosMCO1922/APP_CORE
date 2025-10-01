// src/services/progressService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
console.log('API_URL em uso no progressService:', API_URL); 


export const logExercisePerformanceService = async (performanceData, token) => {
  if (!token) throw new Error('Token não fornecido para logExercisePerformanceService.');
  if (!performanceData || !performanceData.workoutPlanId || !performanceData.planExerciseId || !performanceData.performedAt) {
  throw new Error('Dados obrigatórios em falta para registar desempenho (workoutPlanId, planExerciseId, performedAt).');
  }
  try {
    const url = `${API_URL}/progress/log-performance`;
    console.log('logExercisePerformanceService URL:', url, 'Payload:', performanceData);
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


export const getMyPerformanceForWorkoutPlanService = async (trainingId, workoutPlanId, token) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceForWorkoutPlanService.');
  if (!trainingId || !workoutPlanId) throw new Error('ID do Treino e ID do Plano de Treino são obrigatórios.');
  try {
    const url = `${API_URL}/progress/my-history/training/${trainingId}/plan/${workoutPlanId}`;
    console.log('getMyPerformanceForWorkoutPlanService URL:', url);
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


export const getMyPerformanceHistoryForExerciseService = async (planExerciseId, token) => {
  if (!token) throw new Error('Token não fornecido para getMyPerformanceHistoryForExerciseService.');
  if (!planExerciseId) throw new Error('ID do Exercício do Plano (planExerciseId) é obrigatório.');
  try {
    const url = `${API_URL}/progress/my-exercise-history/${planExerciseId}`;
    console.log('getMyPerformanceHistoryForExerciseService URL:', url); 
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


export const deleteExercisePerformanceLogService = async (logId, token) => {
  if (!token) throw new Error('Token não fornecido para deleteExercisePerformanceLogService.');
  if (!logId) throw new Error('ID do Log é obrigatório para eliminar.');
  try {
    const url = `${API_URL}/progress/log/${logId}`; 
    console.log('deleteExercisePerformanceLogService URL:', url);
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
            console.error("Falha ao fazer parse da resposta JSON de deleteExercisePerformanceLogService:", e);
            console.error("Resposta recebida (texto) de deleteExercisePerformanceLogService:", responseText);
            if(response.ok) return { message: responseText || "Operação concluída (resposta não JSON)." };
            throw new Error(`Resposta do servidor para delete log não é JSON válido. Status: ${response.status}. Resposta: ${responseText.substring(0,200)}...`);
        }
        if (!response.ok) {
            console.error('Erro na resposta de deleteExercisePerformanceLogService (status não OK):', data);
            throw new Error(data.message || `Erro ao eliminar registo. Status: ${response.status}`);
        }
        return data; 
    } else if (!response.ok) {
        throw new Error(`Erro ao eliminar registo. Status: ${response.status}. Nenhuma mensagem adicional do servidor.`);
    }
    return { message: 'Operação de eliminação processada pelo servidor.' };

  } catch (error) {
    console.error("Erro em deleteExercisePerformanceLogService:", error);
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
    console.error("Erro em checkPersonalRecordsService:", error);
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
    console.error("Erro em getMyRecordsService:", error);
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
    console.error("Erro em updatePerformanceLogService:", error);
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
    console.error("Erro em adminGetRecordsForUserService:", error);
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
    console.error("Erro em adminGetFullExerciseHistoryForUserService:", error);
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
    console.error('Erro no serviço de atualização de performance:', error);
    throw error;
  }
};