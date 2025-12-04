import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Hook para manter o ecrã ligado durante o treino
 * Usa a Screen Wake Lock API quando disponível
 */
const useWakeLock = (enabled = true) => {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    // Verificar se a API está disponível
    if (!enabled || !('wakeLock' in navigator)) {
      logger.log('Screen Wake Lock API não está disponível neste navegador');
      return;
    }

    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        logger.log('Wake Lock ativado - ecrã permanecerá ligado');
        
        // Listener para quando o wake lock é libertado (ex: quando o ecrã é bloqueado manualmente)
        wakeLock.addEventListener('release', () => {
          logger.log('Wake Lock foi libertado');
        });
      } catch (err) {
        // Pode falhar se o utilizador já bloqueou o ecrã ou se não há permissão
        logger.warn('Não foi possível ativar o Wake Lock:', err.message);
      }
    };

    // Ativar o wake lock
    requestWakeLock();

    // Reativar quando a página volta ao foco (caso o utilizador tenha bloqueado manualmente)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLock === null) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: libertar o wake lock quando o componente desmonta ou enabled muda
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().then(() => {
          logger.log('Wake Lock libertado');
        }).catch((err) => {
          logger.warn('Erro ao libertar Wake Lock:', err.message);
        });
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);

  return wakeLockRef.current;
};

export default useWakeLock;

