// src/services/authService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const requestPasswordReset = (data) => api.post('/auth/request-password-reset', data);
export const verifyResetCode = (data) => api.post('/auth/verify-reset-code', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const loginAPI = async (email, password, isStaffLogin = false) => {
  const endpoint = isStaffLogin ? '/auth/staff/login' : '/auth/login';
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Erro ao fazer login ${isStaffLogin ? 'como staff' : 'como utilizador'}.`);
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço de loginAPI:", error);
    throw error;
  }
};

export const registerUserAPI = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao registar utilizador.');
    }
    return data; 
  } catch (error) {
    console.error("Erro no serviço registerUserAPI:", error);
    throw error;
  }
};