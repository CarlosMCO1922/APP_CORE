// backend/utils/sentryService.js
// Integração opcional com Sentry para monitorização de erros
// Para usar, instalar: npm install @sentry/node
// E configurar SENTRY_DSN no .env

const logger = require('./logger');

let Sentry = null;
let isInitialized = false;

/**
 * Inicializa Sentry se configurado
 */
const initializeSentry = () => {
  if (isInitialized) return;

  const SENTRY_DSN = process.env.SENTRY_DSN;
  if (!SENTRY_DSN) {
    logger.info('Sentry não configurado (SENTRY_DSN não definido)');
    return;
  }

  try {
    Sentry = require('@sentry/node');
    
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.1,
      // Opções adicionais
      beforeSend(event, hint) {
        // Filtrar eventos se necessário
        return event;
      },
    });

    isInitialized = true;
    logger.info('Sentry inicializado com sucesso');
  } catch (error) {
    logger.warn('Erro ao inicializar Sentry (pode não estar instalado):', error.message);
    Sentry = null;
  }
};

/**
 * Captura uma exceção no Sentry
 * @param {Error} error - Erro a capturar
 * @param {Object} context - Contexto adicional
 */
const captureException = (error, context = {}) => {
  if (!Sentry || !isInitialized) {
    logger.warn('Sentry não disponível, erro não enviado:', error.message);
    return;
  }

  try {
    Sentry.withScope((scope) => {
      // Adicionar contexto
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureException(error);
    });
  } catch (err) {
    logger.error('Erro ao capturar exceção no Sentry:', err);
  }
};

/**
 * Captura uma mensagem no Sentry
 * @param {string} message - Mensagem
 * @param {string} level - Nível (info, warning, error, fatal)
 * @param {Object} context - Contexto adicional
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!Sentry || !isInitialized) {
    logger.warn('Sentry não disponível, mensagem não enviada:', message);
    return;
  }

  try {
    Sentry.withScope((scope) => {
      // Adicionar contexto
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureMessage(message, level);
    });
  } catch (err) {
    logger.error('Erro ao capturar mensagem no Sentry:', err);
  }
};

/**
 * Captura um erro crítico do sistema
 * @param {Object} errorLog - Log de erro
 */
const captureCriticalError = (errorLog) => {
  if (!Sentry || !isInitialized) return;

  try {
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      scope.setTag('errorType', errorLog.errorType);
      scope.setTag('severity', errorLog.severity);
      scope.setContext('errorLog', {
        id: errorLog.id,
        message: errorLog.message,
        url: errorLog.url,
        userId: errorLog.userId,
        deviceInfo: errorLog.deviceInfo,
      });
      
      const error = new Error(errorLog.message);
      error.stack = errorLog.stackTrace;
      Sentry.captureException(error);
    });
  } catch (err) {
    logger.error('Erro ao capturar erro crítico no Sentry:', err);
  }
};

/**
 * Captura um evento de segurança crítico
 * @param {Object} securityLog - Log de segurança
 */
const captureCriticalSecurityEvent = (securityLog) => {
  if (!Sentry || !isInitialized) return;

  try {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('eventType', securityLog.eventType);
      scope.setTag('severity', securityLog.severity);
      scope.setContext('securityLog', {
        id: securityLog.id,
        description: securityLog.description,
        ipAddress: securityLog.ipAddress,
        url: securityLog.url,
        userId: securityLog.userId,
        attemptedRole: securityLog.attemptedRole,
        actualRole: securityLog.actualRole,
      });
      
      Sentry.captureMessage(
        `Security Event: ${securityLog.eventType} - ${securityLog.description}`,
        'error'
      );
    });
  } catch (err) {
    logger.error('Erro ao capturar evento de segurança no Sentry:', err);
  }
};

// Inicializar automaticamente ao carregar o módulo
initializeSentry();

module.exports = {
  initializeSentry,
  captureException,
  captureMessage,
  captureCriticalError,
  captureCriticalSecurityEvent,
  isInitialized: () => isInitialized,
};
