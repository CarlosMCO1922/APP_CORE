// src/services/exerciseService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 

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

export const createExercise = async (exerciseData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para criar exercício.');
  try {
    const response = await fetch(`${API_URL}/exercises`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exerciseData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar exercício.');
    }
    return data;
  } catch (error) {
    console.error("Erro em createExercise:", error);
    throw error;
  }
};

export const updateExercise = async (exerciseId, exerciseData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para atualizar exercício.');
  try {
    const response = await fetch(`${API_URL}/exercises/${exerciseId}`, { 
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exerciseData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar exercício.');
    }
    return data;
  } catch (error) {
    console.error("Erro em updateExercise:", error);
    throw error;
  }
};

export const deleteExercise = async (exerciseId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para eliminar exercício.');
  try {
    const response = await fetch(`${API_URL}/exercises/${exerciseId}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao eliminar exercício.');
    }
    return data; 
  } catch (error) {
    console.error("Erro em deleteExercise:", error);
    throw error;
  }
};