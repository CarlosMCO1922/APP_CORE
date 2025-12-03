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

