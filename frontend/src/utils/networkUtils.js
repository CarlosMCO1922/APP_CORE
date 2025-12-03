// frontend/src/utils/networkUtils.js
// Utilitários para deteção de conectividade e retry

/**
 * Verifica se há conexão à internet
 */
export const isOnline = () => {
  return navigator.onLine !== false;
};

/**
 * Wrapper para fetch com retry automático e timeout
 */
export const fetchWithRetry = async (
  url,
  options = {},
  retries = 2,
  timeout = 30000
) => {
  // Verifica conectividade
  if (!isOnline()) {
    throw new Error('Sem conexão à internet. Verifique a sua ligação.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Se foi timeout ou erro de rede e ainda há retries
    if (
      (error.name === 'AbortError' || error.name === 'TypeError') &&
      retries > 0
    ) {
      // Espera um pouco antes de retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    
    throw error;
  }
};

/**
 * Listener para mudanças de conectividade
 */
export const setupOnlineListener = (onOnline, onOffline) => {
  if (typeof window === 'undefined') return () => {};
  
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

