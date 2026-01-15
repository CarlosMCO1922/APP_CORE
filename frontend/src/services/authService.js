// frontend/src/services/authService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    const response = await fetch(`${API_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

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
  } catch (error) {
    logger.error("Erro em validateAuthService:", error);
    throw error;
  }
};
