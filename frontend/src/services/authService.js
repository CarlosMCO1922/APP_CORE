// frontend/src/services/authService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Regista um novo utilizador
 * @param {Object} userData - Dados do utilizador (firstName, lastName, email, password)
 * @returns {Promise<Object>} - Resposta do servidor
 */
export const registerUserAPI = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de registerUserAPI:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro no registo:', data);
      throw new Error(data.message || `Erro ao registar utilizador. Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    logger.error("Erro em registerUserAPI:", error);
    throw error;
  }
};

/**
 * Solicita reset de password
 * @param {Object} data - Dados com email
 * @returns {Promise<Object>} - Resposta do servidor
 */
export const requestPasswordReset = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de requestPasswordReset:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro ao solicitar reset de password:', responseData);
      throw new Error(responseData.message || `Erro ao solicitar reset de password. Status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    logger.error("Erro em requestPasswordReset:", error);
    throw error;
  }
};

/**
 * Verifica código de reset
 * @param {Object} data - Dados com email e code
 * @returns {Promise<Object>} - Resposta do servidor
 */
export const verifyResetCode = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de verifyResetCode:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro ao verificar código:', responseData);
      throw new Error(responseData.message || `Erro ao verificar código. Status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    logger.error("Erro em verifyResetCode:", error);
    throw error;
  }
};

/**
 * Reseta password
 * @param {Object} data - Dados com email, code e password
 * @returns {Promise<Object>} - Resposta do servidor
 */
export const resetPassword = async (data) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      logger.error("Falha ao fazer parse da resposta JSON de resetPassword:", e);
      logger.error("Resposta recebida (texto):", responseText);
      throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
    }

    if (!response.ok) {
      logger.error('Erro ao resetar password:', responseData);
      throw new Error(responseData.message || `Erro ao resetar password. Status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    logger.error("Erro em resetPassword:", error);
    throw error;
  }
};

/**
 * Valida autenticação e retorna informações reais do utilizador
 * @param {string} token - Token JWT
 * @returns {Promise<Object>} - Dados de autenticação validados
 */
export const validateAuthService = async (token) => {
  if (!token) {
    throw new Error('Token não fornecido para validação.');
  }

  try {
    // Timeout de 8 segundos para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        logger.error("Falha ao fazer parse da resposta JSON de validateAuthService:", e);
        logger.error("Resposta recebida (texto):", responseText);
        throw new Error(`Resposta do servidor não é JSON válido. Status: ${response.status}.`);
      }

      if (!response.ok) {
        logger.error('Erro na validação de autenticação:', data);
        throw new Error(data.message || `Erro ao validar autenticação. Status: ${response.status}`);
      }

      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na validação de autenticação');
      }
      throw fetchError;
    }
  } catch (error) {
    logger.error("Erro em validateAuthService:", error);
    throw error;
  }
};
