// src/services/progressService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; // Ou o seu URL base da API

/**
 * Regista o desempenho de um cliente num exercício específico.
 * @param {object} performanceData - Dados do desempenho, ex: { trainingId, workoutPlanId, planExerciseId, performedAt, setNumber, performedReps, performedWeight, performedDurationSeconds, notes }
 * @param {string} token - Token de autenticação do cliente.
 * @returns {Promise<object>} - A resposta da API.
 */
export const logExercisePerformanceService = async (performanceData, token) => {
  if (!token) throw new Error('Token não fornecido para logExercisePerformanceService.');
  if (!performanceData || !performanceData.trainingId || !performanceData.workoutPlanId || !performanceData.planExerciseId || !performanceData.performedAt) {
    throw new Error('Dados obrigatórios em falta para registar desempenho (trainingId, workoutPlanId, planExerciseId, performedAt).');
  }
  try {
    const response = await fetch(`${API_URL}/progress/log-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(performanceData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao registar desempenho do exercício.');
    }
    return data; // Espera-se { message: 'Desempenho registado...', performance: newPerformance }
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
    const response = await fetch(`<span class="math-inline">\{API\_URL\}/progress/my\-history/training/</span>{trainingId}/plan/${workoutPlanId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar histórico de desempenho do plano.');
    }
    return data; // Espera-se um array de objetos ClientExercisePerformance
  } catch (error) {
    console.error("Erro em getMyPerformanceForWorkoutPlanService:", error);
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
    const response = await fetch(`<span class="math-inline">\{API\_URL\}/progress/my\-exercise\-history/</span>{planExerciseId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar histórico de desempenho do exercício.');
    }
    return data; // Espera-se um array de objetos ClientExercisePerformance
  } catch (error) {
    console.error("Erro em getMyPerformanceHistoryForExerciseService:", error);
    throw error;
  }
};

// TODO (Opcional): Adicionar updateExercisePerformanceService se implementou o endpoint PUT no backend
// export const updateExercisePerformanceService = async (performanceId, performanceData, token) => { ... };