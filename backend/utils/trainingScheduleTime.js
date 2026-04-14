/**
 * Data/hora dos treinos na BD são "relógio de parede" (DATE + TIME) sem offset.
 * O servidor pode correr em UTC; o negócio (ex.: ginásio em Portugal) usa um fuso fixo.
 * Comparar sempre nesse fuso com Date.now() (instante UTC correcto).
 */
const { DateTime } = require('luxon');

/** Fuso fixo para data/hora de treinos na BD (relógio local do negócio). */
const APP_TIMEZONE = 'Europe/Lisbon';

function normalizeDateOnly(dateVal) {
  if (dateVal == null) return null;
  if (typeof dateVal === 'string') return dateVal.split('T')[0];
  if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
  return String(dateVal).split('T')[0];
}

function normalizeTimeHM(timeVal) {
  const s = String(timeVal);
  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '00:00';
  return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
}

/** Instante de início do treino na zona APP_TIMEZONE. */
function trainingStartInAppZone(dateVal, timeVal) {
  const d = normalizeDateOnly(dateVal);
  const t = normalizeTimeHM(timeVal);
  if (!d) return null;
  const dt = DateTime.fromISO(`${d}T${t}`, { zone: APP_TIMEZONE });
  return dt.isValid ? dt : null;
}

function trainingStartMillis(dateVal, timeVal) {
  const dt = trainingStartInAppZone(dateVal, timeVal);
  return dt ? dt.toMillis() : NaN;
}

/** Inscrições fecham 1h antes do início (regra de negócio). */
function isSignupClosedWithinOneHour(dateVal, timeVal) {
  const ms = trainingStartMillis(dateVal, timeVal);
  if (Number.isNaN(ms)) return false;
  return ms - Date.now() < 60 * 60 * 1000;
}

function hasTrainingStartedOrPassed(dateVal, timeVal) {
  const ms = trainingStartMillis(dateVal, timeVal);
  if (Number.isNaN(ms)) return false;
  return ms <= Date.now();
}

/** Data civil "hoje" no fuso da app (alinha com o calendário que o staff/cliente vê). */
function todayDateStringInAppTimezone() {
  return DateTime.now().setZone(APP_TIMEZONE).toISODate();
}

module.exports = {
  APP_TIMEZONE,
  trainingStartInAppZone,
  trainingStartMillis,
  isSignupClosedWithinOneHour,
  hasTrainingStartedOrPassed,
  todayDateStringInAppTimezone,
};
