// src/services/authService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- FUNÇÕES DE RESET DE PASSWORD (CORRIGIDAS) ---
export const requestPasswordReset = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Erro ao pedir a recuperação da palavra-passe.');
    }
    return responseData;
  } catch (error) {
    logger.error("Erro no serviço requestPasswordReset:", error);
    throw error;
  }
};

export const verifyResetCode = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Erro ao verificar o código.');
    }
    return responseData;
  } catch (error) {
    logger.error("Erro no serviço verifyResetCode:", error);
    throw error;
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Erro ao redefinir a palavra-passe.');
    }
    return responseData;
  } catch (error) {
    logger.error("Erro no serviço resetPassword:", error);
    throw error;
  }
};


// --- FUNÇÕES EXISTENTES (JÁ ESTAVAM CORRETAS) ---
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
    logger.error("Erro no serviço de loginAPI:", error);
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
    logger.error("Erro no serviço registerUserAPI:", error);
    throw error;
  }
};