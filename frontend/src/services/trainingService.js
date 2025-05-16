// src/services/trainingService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getAllTrainings = async (token) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}/trainings`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar todos os treinos.');
    return data;
  } catch (error) { console.error("Erro em getAllTrainings:", error); throw error; }
};

export const bookTraining = async (trainingId, token) => {
  if (!token) throw new Error('Token não fornecido para bookTraining.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao inscrever no treino.');
    return data;
  } catch (error) { console.error("Erro em bookTraining:", error); throw error; }
};

export const cancelTrainingBooking = async (trainingId, token) => {
    if (!token) throw new Error('Token não fornecido para cancelTrainingBooking.');
    try {
        const response = await fetch(`${API_URL}/trainings/${trainingId}/book`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao cancelar inscrição no treino.');
        return data;
    } catch (error) { console.error("Erro em cancelTrainingBooking:", error); throw error; }
};

export const adminCreateTraining = async (trainingData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminCreateTraining.');
  try {
    const response = await fetch(`${API_URL}/trainings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(trainingData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar treino.');
    return data;
  } catch (error) { console.error("Erro em adminCreateTraining:", error); throw error; }
};

export const adminUpdateTraining = async (trainingId, trainingData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminUpdateTraining.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(trainingData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar treino.');
    return data;
  } catch (error) { console.error("Erro em adminUpdateTraining:", error); throw error; }
};

export const adminDeleteTraining = async (trainingId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminDeleteTraining.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao eliminar treino.');
    return data;
  } catch (error) { console.error("Erro em adminDeleteTraining:", error); throw error; }
};