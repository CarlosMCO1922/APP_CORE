// src/services/trainingService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- Funções Existentes (Preservadas) ---
// ... (todas as suas funções existentes como getAllTrainings, adminCreateTraining, etc.) ...
// getAllTrainings, adminCreateTraining, getTrainingById, adminUpdateTraining, adminDeleteTraining
// bookTraining, cancelTrainingBooking, adminGetCurrentWeekSignups, adminGetTodayTrainingsCount
// adminBookClientForTrainingService, adminCancelClientBookingService
// adminGetTrainingWaitlistService, adminPromoteClientFromWaitlistService
// createTrainingSeriesService (já adicionada para o admin)
// ... (COLE AQUI AS FUNÇÕES EXISTENTES DO SEU FICHEIRO trainingService.js SE FOREM DIFERENTES DAS QUE ENVIEI ANTERIORMENTE) ...
// Vou repetir as funções de séries para garantir que estão completas e corretas.

export const getAllTrainings = async (token, filters = {}) => {
  if (!token) throw new Error('Token não fornecido para getAllTrainings.');
  try {
    const queryParams = new URLSearchParams();
    if (filters.instructorId && filters.instructorId !== '') queryParams.append('instructorId', filters.instructorId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.nameSearch && filters.nameSearch.trim() !== '') queryParams.append('nameSearch', filters.nameSearch.trim());

    const queryString = queryParams.toString();
    const fetchURL = queryString ? `${API_URL}/trainings?${queryString}` : `${API_URL}/trainings`;

    console.log("[trainingService] Fetching trainings from URL:", fetchURL);

    const response = await fetch(fetchURL, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}.`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.errorDetails || errorMessage;
      } catch (e) {
        errorMessage += ` Resposta do servidor não é JSON: ${responseText.substring(0, 200)}...`;
      }
      throw new Error(errorMessage);
    }
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error("Erro em getAllTrainings service:", error);
    throw error;
  }
};

export const adminCreateTraining = async (trainingData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
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

export const getTrainingById = async (trainingId, token) => {
  if (!token) throw new Error('Token não fornecido para getTrainingById.');
  if (!trainingId) throw new Error('ID do Treino não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar detalhes do treino.');
    return data;
  } catch (error) { console.error("Erro em getTrainingById:", error); throw error; }
};

export const adminUpdateTraining = async (trainingId, trainingData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido para atualização.');
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
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido para eliminação.');
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

export const bookTraining = async (trainingId, token) => {
  if (!token) throw new Error('Token de cliente não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido para inscrição.');
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
  if (!token) throw new Error('Token de cliente não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido para cancelar inscrição.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/book`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao cancelar inscrição no treino.');
    return data;
  } catch (error) { console.error("Erro em cancelTrainingBooking:", error); throw error; }
};

export const adminGetCurrentWeekSignups = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/stats/current-week-signups`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar inscrições da semana.');
    return data;
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
    return data;
  } catch (error) { console.error("Erro em adminGetTodayTrainingsCount:", error); throw error; }
};

export const adminBookClientForTrainingService = async (trainingId, userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId || !userId) throw new Error('ID do Treino e ID do Utilizador são obrigatórios.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/admin-book-client`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: userId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao inscrever cliente no treino.');
    return data;
  } catch (error) {
    console.error("Erro em adminBookClientForTrainingService:", error);
    throw error;
  }
};

export const adminCancelClientBookingService = async (trainingId, userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId || !userId) throw new Error('ID do Treino e ID do Utilizador são obrigatórios.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/admin-cancel-booking/${userId}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao cancelar inscrição do cliente no treino.');
    return data; 
  } catch (error) {
    console.error("Erro em adminCancelClientBookingService:", error);
    throw error;
  }
};

export const adminGetTrainingWaitlistService = async (trainingId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido.');
  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/waitlist`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar lista de espera do treino.');
    return data; 
  } catch (error) {
    console.error(`Erro em adminGetTrainingWaitlistService para trainingId ${trainingId}:`, error);
    throw error;
  }
};

export const adminPromoteClientFromWaitlistService = async (trainingId, userIdToPromote, token, waitlistEntryId = null) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!trainingId) throw new Error('ID do Treino não fornecido.');
  if (!userIdToPromote && !waitlistEntryId) throw new Error('ID do Utilizador ou ID da Entrada na Lista de Espera é obrigatório.');

  const body = {};
  if (userIdToPromote) body.userId = userIdToPromote;
  if (waitlistEntryId) body.waitlistEntryId = waitlistEntryId;

  try {
    const response = await fetch(`${API_URL}/trainings/${trainingId}/waitlist/promote`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao promover cliente da lista de espera.');
    return data;
  } catch (error) {
    console.error(`Erro em adminPromoteClientFromWaitlistService para trainingId ${trainingId}:`, error);
    throw error;
  }
};

// --- FUNÇÕES PARA SÉRIES DE TREINOS RECORRENTES ---

/**
 * Admin cria uma nova série de treinos recorrentes.
 */
export const createTrainingSeriesService = async (seriesData, token) => {
  if (!token) throw new Error('Token não fornecido para criar série de treinos.');
  // O backend montou trainingSeriesRoutes em '/training-series'
  const url = `${API_URL}/training-series`; // Ajusta se o teu prefixo global de API for diferente (ex: /api/training-series)

  console.log('Frontend Service: Criando série de treinos. URL:', url, 'Payload:', seriesData);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(seriesData),
  });

  // Tratamento de resposta mais robusto
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`Erro HTTP ${response.status} ao criar série. Resposta não é JSON.`);
    }
    throw new Error(errorData.message || `Erro ${response.status} ao criar série de treinos.`);
  }
  return response.json(); 
};


export const getActiveTrainingSeriesForClientService = async (token) => {
  if (!token) throw new Error('Token não fornecido para buscar séries ativas.');
  const url = `${API_URL}/training-series`; 
  console.log('Frontend Service: Buscando séries ativas para cliente. URL:', url);
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
     console.error("Falha ao parsear JSON de getActiveTrainingSeriesForClientService", e);
     console.error("Resposta (texto):", responseText);
     throw new Error(`Resposta do servidor para buscar séries (cliente) não é JSON. Status: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao buscar séries de treinos ativas.');
  }
  return data; 
};

export const createSeriesSubscriptionService = async (subscriptionData, token) => {
  if (!token) throw new Error('Token não fornecido para criar subscrição em série.');
  if (!subscriptionData || !subscriptionData.trainingSeriesId || !subscriptionData.clientSubscriptionEndDate) {
    throw new Error('Dados insuficientes para subscrição: trainingSeriesId e clientSubscriptionEndDate são obrigatórios.');
  }
  const url = `${API_URL}/training-series/subscriptions`;

  console.log('Frontend Service: Criando subscrição em série. URL:', url, 'Payload:', subscriptionData);
  const response = await fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(subscriptionData),
  });


  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch(e) {
      console.error("Resposta do servidor não é JSON:", responseText);
      throw new Error(`Erro HTTP ${response.status} ao subscrever série. Resposta: ${responseText.substring(0, 200)}...`);
    }
    throw new Error(errorData.message || `Erro ${response.status} ao inscrever-se na série de treinos.`);
  }
  return response.json();
};
