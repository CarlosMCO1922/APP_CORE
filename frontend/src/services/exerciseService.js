// src/services/exerciseService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Função para buscar todos os exercícios (usada no AdminManageWorkoutPlansPage)
export const getAllExercises = async (token) => {
  if (!token) throw new Error('Token não fornecido para getAllExercises.');
  try {
    const response = await fetch(`${API_URL}/exercises`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar todos os exercícios.');
    }
    return data;
  } catch (error) {
    console.error("Erro em getAllExercises:", error);
    throw error;
  }
};

// Futuramente, podes adicionar aqui outras funções relacionadas com exercícios se necessário,
// por exemplo, para criar, atualizar ou apagar exercícios pela interface de admin,
// embora atualmente a gestão de exercícios base possa não estar no escopo imediato
// da página de gestão de planos de treino.

/*
Exemplo de outras funções que poderias adicionar se tivesses uma página de gestão de Exercícios:

export const createExercise = async (exerciseData, token) => {
  // ... implementação ...
};

export const updateExercise = async (exerciseId, exerciseData, token) => {
  // ... implementação ...
};

export const deleteExercise = async (exerciseId, token) => {
  // ... implementação ...
};
*/