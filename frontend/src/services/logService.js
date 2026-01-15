// frontend/src/services/logService.js
import { logger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Envia um erro para o backend
 * @param {Object} errorData - Dados do erro
 * @param {string} token - Token de autenticação (opcional)
 */
export const logErrorService = async (errorData, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Adicionar token se disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/logs/error`, {
      method: 'POST',
      headers,
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('Erro ao enviar log para backend:', errorText);
    } else {
      logger.log('Erro registado com sucesso no backend');
    }
  } catch (error) {
    // Não falhar se não conseguir enviar log
    logger.warn('Erro ao enviar log (não crítico):', error);
  }
};

/**
 * Obtém logs de erro (apenas admin/staff)
 * @param {string} token - Token de autenticação
 * @param {Object} filters - Filtros (severity, errorType, resolved, userId, startDate, endDate)
 * @param {number} limit - Limite de resultados
 * @param {number} offset - Offset para paginação
 */
export const getErrorLogsService = async (token, filters = {}, limit = 50, offset = 0) => {
  if (!token) throw new Error('Token não fornecido.');

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      ),
    });

    const response = await fetch(`${API_URL}/logs/errors?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao obter logs de erro.');
    }

    return data;
  } catch (error) {
    logger.error('Erro em getErrorLogsService:', error);
    throw error;
  }
};

/**
 * Obtém logs de segurança (apenas admin/staff)
 * @param {string} token - Token de autenticação
 * @param {Object} filters - Filtros (eventType, severity, userId, startDate, endDate)
 * @param {number} limit - Limite de resultados
 * @param {number} offset - Offset para paginação
 */
export const getSecurityLogsService = async (token, filters = {}, limit = 50, offset = 0) => {
  if (!token) throw new Error('Token não fornecido.');

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      ),
    });

    const response = await fetch(`${API_URL}/logs/security?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao obter logs de segurança.');
    }

    return data;
  } catch (error) {
    logger.error('Erro em getSecurityLogsService:', error);
    throw error;
  }
};

/**
 * Marca um erro como resolvido
 * @param {string} token - Token de autenticação
 * @param {number} logId - ID do log
 */
export const resolveErrorLogService = async (token, logId) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!logId) throw new Error('ID do log é obrigatório.');

  try {
    const response = await fetch(`${API_URL}/logs/errors/${logId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao marcar log como resolvido.');
    }

    return data;
  } catch (error) {
    logger.error('Erro em resolveErrorLogService:', error);
    throw error;
  }
};

/**
 * Obtém informações do dispositivo
 */
const getDeviceInfo = () => {
  return {
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    userAgent: navigator.userAgent,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
};

/**
 * Inicializa handlers globais para capturar erros
 * @param {Function} getToken - Função para obter token atual
 */
export const initializeErrorHandlers = (getToken) => {
  if (typeof window === 'undefined') return; // SSR safety
  // Handler para erros JavaScript não capturados
  window.onerror = (message, source, lineno, colno, error) => {
    const errorData = {
      errorType: 'JS_ERROR',
      message: message || 'Erro JavaScript não capturado',
      stackTrace: error?.stack || `Linha ${lineno}, Coluna ${colno} em ${source}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceInfo: getDeviceInfo(),
      severity: 'MEDIUM',
      metadata: {
        source,
        lineno,
        colno,
        errorName: error?.name,
      },
    };

    logErrorService(errorData, getToken?.()).catch(() => {});
    
    // Retornar false para não prevenir comportamento padrão do browser
    return false;
  };

  // Handler para promessas rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorData = {
      errorType: 'UNHANDLED_PROMISE_REJECTION',
      message: error?.message || 'Promise rejeitada não tratada',
      stackTrace: error?.stack || String(error),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceInfo: getDeviceInfo(),
      severity: 'HIGH',
      metadata: {
        errorName: error?.name,
        errorType: typeof error,
      },
    };

    logErrorService(errorData, getToken?.()).catch(() => {});
  });

  logger.log('Handlers globais de erro inicializados');
};

/**
 * Obtém estatísticas de logs para gráficos
 * @param {string} token - Token de autenticação
 * @param {number} days - Número de dias para análise (padrão: 30)
 */
export const getLogsStatsService = async (token, days = 30) => {
  if (!token) throw new Error('Token não fornecido.');

  try {
    const response = await fetch(`${API_URL}/logs/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao obter estatísticas.');
    }

    return data;
  } catch (error) {
    logger.error('Erro em getLogsStatsService:', error);
    throw error;
  }
};

/**
 * Exporta logs para CSV
 * @param {string} token - Token de autenticação
 * @param {string} type - 'errors' ou 'security'
 * @param {Object} filters - Filtros a aplicar
 */
export const exportLogsService = async (token, type = 'errors', filters = {}) => {
  if (!token) throw new Error('Token não fornecido.');

  try {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      )
    );

    const response = await fetch(`${API_URL}/logs/export/${type}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao exportar logs.');
    }

    // Criar blob e fazer download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    logger.error('Erro em exportLogsService:', error);
    throw error;
  }
};
