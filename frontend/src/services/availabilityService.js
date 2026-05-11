// frontend/src/services/availabilityService.js
import { logger } from '../utils/logger';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const getAvailabilitySlotsService = async ({ date, staffId }, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!date) throw new Error('Data é obrigatória.');

  const params = new URLSearchParams({ date: String(date) });
  if (staffId != null && staffId !== '') params.set('staffId', String(staffId));

  try {
    const response = await fetch(`${API_URL}/availability/slots?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao obter disponibilidade.');
    return data;
  } catch (error) {
    logger.error('Erro em getAvailabilitySlotsService:', error);
    throw error;
  }
};

export const setAvailabilitySlotsService = async ({ date, staffId, blocks }, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!date) throw new Error('Data é obrigatória.');
  try {
    const response = await fetch(`${API_URL}/availability/slots`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, staffId, blocks }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao guardar disponibilidade.');
    return data;
  } catch (error) {
    logger.error('Erro em setAvailabilitySlotsService:', error);
    throw error;
  }
};

