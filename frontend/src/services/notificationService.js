// src/services/notificationService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 

export const getMyNotificationsService = async (token, page = 1, limit = 10, status = null) => {
  if (!token) throw new Error('Token não fornecido para getMyNotificationsService.');
  try {
    const queryParams = new URLSearchParams({ page, limit });
    if (status) { 
      queryParams.append('status', status);
    }

    const response = await fetch(`${API_URL}/notifications/my-notifications?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar notificações.');
    return data; 
  } catch (error) {
    console.error("Erro em getMyNotificationsService:", error);
    throw error;
  }
};

export const markNotificationAsReadService = async (notificationId, token) => {
  if (!token) throw new Error('Token não fornecido para markNotificationAsReadService.');
  if (!notificationId) throw new Error('ID da notificação não fornecido.');
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao marcar notificação como lida.');
    return data; 
  } catch (error) {
    console.error("Erro em markNotificationAsReadService:", error);
    throw error;
  }
};

export const markAllNotificationsAsReadService = async (token) => {
  if (!token) throw new Error('Token não fornecido para markAllNotificationsAsReadService.');
  try {
    const response = await fetch(`${API_URL}/notifications/mark-all-as-read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao marcar todas as notificações como lidas.');
    return data; 
  } catch (error) {
    console.error("Erro em markAllNotificationsAsReadService:", error);
    throw error;
  }
};