// frontend/src/services/publicBookingService.js
// Chamadas à API pública (sem autenticação) para pedidos de consulta e treino experimental.
import { logger } from '../utils/logger';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const base = `${API_URL}/public`;

export const getStaffForAppointments = async () => {
  try {
    const response = await fetch(`${base}/staff-for-appointments`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao carregar profissionais.');
    return data;
  } catch (error) {
    logger.error('Erro em getStaffForAppointments:', error);
    throw error;
  }
};

export const getAvailableSlots = async (date, staffId, durationMinutes = 60) => {
  if (!date || !staffId) throw new Error('Data e profissional são obrigatórios.');
  try {
    const params = new URLSearchParams({ date, staffId: String(staffId), durationMinutes: String(durationMinutes) });
    const response = await fetch(`${base}/available-slots?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao carregar horários.');
    return data;
  } catch (error) {
    logger.error('Erro em getAvailableSlots:', error);
    throw error;
  }
};

export const submitPublicAppointmentRequest = async (payload) => {
  const { staffId, date, time, durationMinutes, notes, guestName, guestEmail, guestPhone } = payload;
  if (!guestName || !guestEmail || !guestPhone || !staffId || !date || !time) {
    throw new Error('Nome, email, telemóvel, profissional, data e hora são obrigatórios.');
  }
  try {
    const response = await fetch(`${base}/appointment-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId,
        date,
        time,
        durationMinutes: durationMinutes || 60,
        notes: notes || undefined,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao enviar pedido.');
    return data;
  } catch (error) {
    logger.error('Erro em submitPublicAppointmentRequest:', error);
    throw error;
  }
};

/**
 * Obtém treinos para a página pública. Tenta /public/trainings primeiro;
 * se falhar, tenta /trainings/public-list (mesma query que o calendário).
 */
export const getPublicTrainings = async () => {
  const urls = [
    `${API_URL}/public/trainings`,
    `${API_URL}/trainings/public-list`,
  ];
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.errorDetails || `HTTP ${response.status}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
      logger.warn(`getPublicTrainings: falha em ${url}, a tentar próximo:`, error.message);
    }
  }
  logger.error('getPublicTrainings: todas as tentativas falharam', lastError);
  throw lastError;
};

export const submitGuestTrainingSignup = async (trainingId, payload) => {
  const { guestName, guestEmail, guestPhone } = payload;
  if (!guestName || !guestEmail || !guestPhone || !trainingId) {
    throw new Error('Nome, email, telemóvel e treino são obrigatórios.');
  }
  try {
    const response = await fetch(`${base}/trainings/${trainingId}/guest-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao enviar inscrição.');
    return data;
  } catch (error) {
    logger.error('Erro em submitGuestTrainingSignup:', error);
    throw error;
  }
};

const publicBase = () => `${API_URL}/public`;

/** Confirma reagendamento de consulta (link do email). Token em query. */
export const confirmAppointmentReschedule = async (token) => {
  const response = await fetch(`${publicBase()}/confirm-appointment-reschedule?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro ao confirmar reagendamento.');
  return data;
};

/** Confirma reagendamento de treino (link do email). Token em query. */
export const confirmTrainingReschedule = async (token) => {
  const response = await fetch(`${publicBase()}/confirm-training-reschedule?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro ao confirmar reagendamento.');
  return data;
};
