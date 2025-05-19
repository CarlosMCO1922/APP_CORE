// src/services/workoutPlanService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

export const getWorkoutPlansByTrainingId = async (trainingId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/workout-plans`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar planos de treino.');
    }
    return data;
  } catch (error) {
    console.error("Erro em getWorkoutPlansByTrainingId:", error);
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

// getExercisesForWorkoutPlan já está no controller de WorkoutPlan, e a rota é /api/workout-plans/:planId/exercises
// Esta função será chamada por getWorkoutPlansByTrainingId através do include no controller.
// Mas se precisares de uma chamada direta, podes adicioná-la:
export const getExercisesByPlanId = async (planId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  try {
    const response = await fetch(`${API_URL}/workout-plans/${planId}/exercises`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar exercícios do plano.');
    }
    return data;
  } catch (error) {
    console.error("Erro em getExercisesByPlanId:", error);
    throw error;
  }
}

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