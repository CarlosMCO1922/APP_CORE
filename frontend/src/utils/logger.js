// frontend/src/utils/logger.js
// Sistema de logging condicional para produção

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      // Em produção, apenas erros críticos
      // Podes integrar com serviço de logging (Sentry, etc.)
    }
  },
  
  error: (...args) => {
    // Erros sempre devem ser logados, mesmo em produção
    console.error(...args);
    // Aqui podes adicionar integração com serviço de logging
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

