// src/services/trainingService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const getAllTrainings = async (token, filters = {}) => {
  if (!token) throw new Error('Token não fornecido para getAllTrainings.');
  try {
    const queryParams = new URLSearchParams();
    if (filters.instructorId) queryParams.append('instructorId', filters.instructorId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.nameSearch) queryParams.append('nameSearch', filters.nameSearch);

    const queryString = queryParams.toString();
    const fetchURL = queryString ? `<span class="math-inline">\{API\_URL\}/trainings?</span>{queryString}` : `${API_URL}/trainings`;

    const response = await fetch(fetchURL, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar todos os treinos.');
    return data;
  } catch (error) {
    console.error("Erro em getAllTrainings service:", error);
    throw error;
  }
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

export const adminGetCurrentWeekSignups = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/stats/current-week-signups`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar inscrições da semana.');
    return data; // Espera-se { currentWeekSignups: XX }
  } catch (error) { console.error("Erro em adminGetCurrentWeekSignups:", error); throw error; }
};

export const adminGetTodayTrainingsCount = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/stats/today-count`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar contagem de treinos de hoje.');
    return data; // Espera-se { todayTrainingsCount: XX }
  } catch (error) { console.error("Erro em adminGetTodayTrainingsCount:", error); throw error; }
};