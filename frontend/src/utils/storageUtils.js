// frontend/src/utils/storageUtils.js
// Utilitários para gestão segura do localStorage

const STORAGE_VERSION = '1.0.0';
const STORAGE_VERSION_KEY = 'app_storage_version';

/**
 * Valida se os dados do localStorage têm a estrutura esperada
 */
export const validateStorageData = (data, expectedStructure) => {
  if (!data || typeof data !== 'object') return false;
  
  // Verifica se tem as propriedades mínimas esperadas
  for (const key of expectedStructure.required || []) {
    if (!(key in data)) return false;
  }
  
  // Valida tipos se especificado
  if (expectedStructure.types) {
    for (const [key, type] of Object.entries(expectedStructure.types)) {
      if (key in data && typeof data[key] !== type) return false;
    }
  }
  
  return true;
};

/**
 * Limpa dados antigos/incompatíveis do localStorage
 */
export const clearInvalidStorage = () => {
  try {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVersion !== STORAGE_VERSION) {
      // Versão mudou, limpar dados antigos
      localStorage.removeItem('activeWorkoutSession');
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    }
  } catch (error) {
    console.error('Erro ao limpar storage inválido:', error);
  }
};

/**
 * Lê dados do localStorage com validação
 */
export const safeGetItem = (key, validator = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    
    // Se houver validador, verifica estrutura
    if (validator && !validator(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Escreve dados no localStorage com validação
 */
export const safeSetItem = (key, value) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return true;
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erro ao escrever ${key} no localStorage:`, error);
    // Se storage está cheio, tenta limpar dados antigos
    if (error.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem('activeWorkoutSession');
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {
        console.error('Falha ao limpar storage e retry:', retryError);
        return false;
      }
    }
    return false;
  }
};

/**
 * Validador para activeWorkoutSession
 */
export const validateWorkoutSession = (data) => {
  return validateStorageData(data, {
    required: ['startTime', 'setsData'],
    types: {
      startTime: 'number',
      setsData: 'object',
      name: 'string',
      id: 'number'
    }
  });
};

/**
 * Validador para userData
 */
export const validateUserData = (data) => {
  return validateStorageData(data, {
    required: ['id', 'email'],
    types: {
      id: 'number',
      email: 'string',
      firstName: 'string',
      lastName: 'string'
    }
  });
};

/**
 * Verifica se um treino é muito antigo e deve ser considerado abandonado
 * @param {Object} workout - Objeto do treino
 * @param {number} maxAgeHours - Idade máxima em horas (padrão: 48)
 * @returns {boolean} - true se o treino é muito antigo
 */
export const isWorkoutAbandoned = (workout, maxAgeHours = 48) => {
  if (!workout || !workout.startTime) return true;
  
  const now = Date.now();
  const workoutAge = now - workout.startTime;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  
  return workoutAge > maxAgeMs;
};

/**
 * Obtém o timestamp da última atualização de um treino
 * @param {Object} workout - Objeto do treino
 * @returns {number} - Timestamp da última atualização
 */
export const getWorkoutLastUpdate = (workout) => {
  if (!workout) return 0;
  
  // Se houver lastUpdated, usar esse
  if (workout.lastUpdated) return workout.lastUpdated;
  
  // Caso contrário, usar o timestamp do último set completado
  if (workout.setsData && Object.keys(workout.setsData).length > 0) {
    const sets = Object.values(workout.setsData);
    const lastSet = sets.reduce((latest, set) => {
      const setTime = set.performedAt ? new Date(set.performedAt).getTime() : 0;
      const latestTime = latest.performedAt ? new Date(latest.performedAt).getTime() : 0;
      return setTime > latestTime ? set : latest;
    }, sets[0]);
    
    if (lastSet && lastSet.performedAt) {
      return new Date(lastSet.performedAt).getTime();
    }
  }
  
  // Fallback: usar startTime
  return workout.startTime || 0;
};

/**
 * Resolve conflito entre dois treinos, retornando o mais recente
 * @param {Object} workout1 - Primeiro treino
 * @param {Object} workout2 - Segundo treino
 * @returns {Object|null} - O treino mais recente, ou null se ambos inválidos
 */
export const resolveWorkoutConflict = (workout1, workout2) => {
  if (!workout1 && !workout2) return null;
  if (!workout1) return workout2;
  if (!workout2) return workout1;
  
  // Validar ambos
  const valid1 = validateWorkoutSession(workout1);
  const valid2 = validateWorkoutSession(workout2);
  
  if (!valid1 && !valid2) return null;
  if (!valid1) return workout2;
  if (!valid2) return workout1;
  
  // Comparar timestamps de última atualização
  const update1 = getWorkoutLastUpdate(workout1);
  const update2 = getWorkoutLastUpdate(workout2);
  
  // Retornar o mais recente
  return update1 >= update2 ? workout1 : workout2;
};

