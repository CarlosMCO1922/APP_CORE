// src/services/workoutPlanService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- Funções para WorkoutPlan ---

export const createWorkoutPlanForTraining = async (trainingId, planData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/workout-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar plano de treino.');
    }
    return data;
  } catch (error) {
    console.error("Erro em createWorkoutPlanForTraining:", error);
    throw error;
  }
};


export const updateWorkoutPlan = async (planId, planData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar plano de treino.');
    }
    return data;
  } catch (error) {
    console.error("Erro em updateWorkoutPlan:", error);
    throw error;
  }
};

export const deleteWorkoutPlan = async (planId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao eliminar plano de treino.');
    }
    return data;
  } catch (error) {
    console.error("Erro em deleteWorkoutPlan:", error);
    throw error;
  }
};


// --- Funções para WorkoutPlanExercise ---

export const addExerciseToPlan = async (planId, exercisePlanData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exercisePlanData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao adicionar exercício ao plano.');
    }
    return data;
  } catch (error) {
    console.error("Erro em addExerciseToPlan:", error);
    throw error;
  }
};

export const adminCreateGlobalWorkoutPlan = async (planData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/global`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(planData), // { name, notes, isVisible, exercises: [...] }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar plano de treino global.');
    return data;
  } catch (error) { console.error("Erro em adminCreateGlobalWorkoutPlan:", error); throw error; }
};

export const adminGetAllGlobalWorkoutPlans = async (token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/global`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar planos de treino globais.');
    return data;
  } catch (error) { console.error("Erro em adminGetAllGlobalWorkoutPlans:", error); throw error; }
};

export const adminGetGlobalWorkoutPlanById = async (planId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/global/${planId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar detalhes do plano de treino global.');
    return data;
  } catch (error) { console.error("Erro em adminGetGlobalWorkoutPlanById:", error); throw error; }
};

/**
 * CLIENTE: Busca os detalhes de um plano de treino global específico que está marcado como visível.
 * @param {string} planId - O ID do plano de treino global.
 * @param {string} token - O token de autenticação do cliente.
 * @returns {Promise<object>} O objeto do plano de treino.
 */
export const getGlobalWorkoutPlanByIdClient = async (planId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!planId) throw new Error('ID do Plano não fornecido.');
  try {
    // Chama a nova rota que criámos no backend
    const response = await fetch(`${API_URL}/workout-plans/visible/${planId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar os detalhes do plano de treino.');
    }
    return data;
  } catch (error) {
    console.error("Erro em getGlobalWorkoutPlanByIdClient:", error);
    throw error;
  }
};


/**
 * CLIENTE: Busca todos os planos de treino globais que estão marcados como visíveis.
 * @param {string} token - O token de autenticação do cliente.
 * @param {string} searchTerm - O termo de pesquisa opcional.
 * @returns {Promise<Array>} Um array de planos de treino visíveis.
 */
export const getVisibleWorkoutPlansService = async (token, searchTerm = '') => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const queryParams = new URLSearchParams();
    if (searchTerm) {
      queryParams.append('name', searchTerm);
    }
    
    const response = await fetch(`${API_URL}/workout-plans/visible?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar os planos de treino visíveis.');
    }
    return data;
  } catch (error) {
    console.error("Erro em getVisibleWorkoutPlansService:", error);
    throw error;
  }
};

export const adminUpdateGlobalWorkoutPlan = async (planId, planData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/global/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(planData), // { name?, notes?, isVisible?, exercises?: [...] }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar plano de treino global.');
    return data;
  } catch (error) { console.error("Erro em adminUpdateGlobalWorkoutPlan:", error); throw error; }
};

export const adminDeleteGlobalWorkoutPlan = async (planId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/global/${planId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao eliminar plano de treino global.');
    return data;
  } catch (error) { console.error("Erro em adminDeleteGlobalWorkoutPlan:", error); throw error; }
};

// --- Funções para ASSOCIAR/DESASSOCIAR Planos a Treinos Específicos ---

export const adminAssignPlanToTraining = async (planId, trainingId, orderInTraining, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}/assign-to-training/${trainingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ orderInTraining }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao associar plano a treino.');
    return data;
  } catch (error) { console.error("Erro em adminAssignPlanToTraining:", error); throw error; }
};

export const adminRemovePlanFromTraining = async (planId, trainingId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}/remove-from-training/${trainingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao remover associação do plano ao treino.');
    return data;
  } catch (error) { console.error("Erro em adminRemovePlanFromTraining:", error); throw error; }
};

// --- Funções para gerir EXERCÍCIOS dentro de um plano "modelo" / global ---
// As funções que já tinhas para addExerciseToPlan, updateExerciseInPlan, removeExerciseFromPlan
// podem ser adaptadas ou duplicadas para funcionar com os IDs de planos globais.
// Exemplo: addExerciseToGlobalPlan, etc. que chamariam rotas como /api/workout-plans/global/:planId/exercises

export const addExerciseToGlobalPlan = async (planId, exerciseData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    // Assume que a rota no backend para adicionar exercício a plano global é:
    // POST /api/workout-plans/global/:planId/exercises
    // (Terás de criar esta rota no backend/routes/workoutPlanRoutes.js e a função correspondente no controller)
    const response = await fetch(`${API_URL}/workout-plans/global/${planId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(exerciseData), // { exerciseId, sets, reps, order, notes, etc. }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao adicionar exercício ao plano global.');
    return data;
  } catch (error) { console.error("Erro em addExerciseToGlobalPlan:", error); throw error; }
};

export const updateExerciseInGlobalPlan = async (planExerciseId, exerciseData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    // Assume que a rota no backend para atualizar exercício num plano global é:
    // PUT /api/workout-plans/global/exercises/:planExerciseId
    // (Terás de criar esta rota e a função no controller)
    const response = await fetch(`${API_URL}/workout-plans/global/exercises/${planExerciseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(exerciseData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar exercício no plano global.');
    return data;
  } catch (error) { console.error("Erro em updateExerciseInGlobalPlan:", error); throw error; }
};

export const removeExerciseFromGlobalPlan = async (planExerciseId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    // Assume que a rota no backend para remover exercício de plano global é:
    // DELETE /api/workout-plans/global/exercises/:planExerciseId
    // (Terás de criar esta rota e a função no controller)
    const response = await fetch(`${API_URL}/workout-plans/global/exercises/${planExerciseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao remover exercício do plano global.');
    return data;
  } catch (error) { console.error("Erro em removeExerciseFromGlobalPlan:", error); throw error; }
};


// Funções que buscam planos associados a um TREINO específico (M:N)
// getWorkoutPlansByTrainingId já existe e deve ser atualizada para usar a relação M:N
// Esta função é chamada pela AdminManageWorkoutPlansPage e ClientTrainingPlanPage
export const getWorkoutPlansByTrainingId = async (trainingId, token) => {
    if (!token) throw new Error('Token não fornecido.');
    if (!trainingId) throw new Error('ID do Treino não fornecido.');
    try {
      const response = await fetch(`${API_URL}/trainings/${trainingId}/workout-plans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar planos de treino associados ao treino.');
      }
      return data; // Espera um array de WorkoutPlans com seus WorkoutPlanExercises
    } catch (error) {
      console.error("Erro em getWorkoutPlansByTrainingId:", error);
      throw error;
    }
};


export const updateExerciseInPlan = async (planExerciseId, exercisePlanData, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/exercises/${planExerciseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exercisePlanData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar exercício no plano.');
    }
    return data;
  } catch (error) {
    console.error("Erro em updateExerciseInPlan:", error);
    throw error;
  }
};

export const removeExerciseFromPlan = async (planExerciseId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/exercises/${planExerciseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao remover exercício do plano.');
    }
    return data;
  } catch (error) {
    console.error("Erro em removeExerciseFromPlan:", error);
    throw error;
  }
};