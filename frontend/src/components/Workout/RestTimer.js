// src/components/Workout/RestTimer.js
import { logger } from '../../utils/logger';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const TimerContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 350px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const TimerTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const TimerControlsRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  width: 100%;
`;

const TimerText = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const CloseTimerButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const TimerControlButton = styled.button`
  background-color: ${({ theme }) => theme.colors.textDark};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 8px;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 12px rgba(0,0,0,0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const RestTimer = ({ duration, onFinish }) => {
  // Usar timestamp para calcular tempo decorrido (funciona mesmo em segundo plano)
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  // Duração dinâmica que pode ser ajustada
  const [currentDuration, setCurrentDuration] = useState(duration);
  const intervalRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const notificationClickedRef = useRef(false);
  const hasTriggeredNotificationRef = useRef(false);
  const notificationScheduledRef = useRef(false); // Prevenir múltiplas notificações
  const lastVisibilityChangeRef = useRef(Date.now()); // Para calcular tempo quando volta ao foco

  // Função para agendar/cancelar notificação (apenas uma por vez)
  const scheduleNotification = async (remainingSeconds) => {
    // Se já existe uma notificação agendada, cancelar primeiro
    if (notificationScheduledRef.current) {
      // Tentar cancelar a notificação anterior
      try {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        // Cancelar notificação push se existir
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          const notifReg = regs.find(r => r.active && r.active.scriptURL.includes('notifications-sw.js'));
          if (notifReg && notifReg.pushManager) {
            const subscription = await notifReg.pushManager.getSubscription();
            if (subscription) {
              // Enviar pedido para cancelar notificação agendada
              fetch(`${API_URL}/push/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription })
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        logger.warn('Erro ao cancelar notificação anterior:', e);
      }
    }

    // Marcar que uma notificação está agendada
    notificationScheduledRef.current = true;

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      const notifReg = regs.find(r => r.active && r.active.scriptURL.includes('notifications-sw.js')) || (await navigator.serviceWorker.register('/notifications-sw.js'));
      if (!notifReg) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;
      const sub = await notifReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });

      // Usar o tempo restante exato (sem adicionar tempo extra)
      const remaining = Math.max(0, remainingSeconds);
      fetch(`${API_URL}/push/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          delaySeconds: remaining,
          title: 'Descanso concluído',
          body: 'O seu tempo de descanso terminou. Vamos continuar? 💪',
          tag: 'rest-timer' // Tag única para evitar duplicados
        })
      }).catch((error) => {
        notificationScheduledRef.current = false;
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Erro ao agendar notificação push:', error);
        }
      });
    } catch (e) {
      notificationScheduledRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Erro ao configurar notificação push:', e);
      }
    }
  };

  // useEffect para inicializar o timer apenas uma vez
  useEffect(() => {
    // Agenda notificação inicial com o tempo total (apenas uma vez)
    if (!notificationScheduledRef.current) {
      scheduleNotification(currentDuration);
    }

    // Função para calcular tempo decorrido baseado em timestamp real
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    // Atualizar imediatamente
    updateElapsedTime();

    // Cria um intervalo que é executado a cada segundo
    intervalRef.current = setInterval(updateElapsedTime, 1000);

    // Listener para quando a app volta ao foco (corrige tempo quando estava em segundo plano)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quando volta ao foco, recalcular o tempo baseado no timestamp real
        const now = Date.now();
        const timeInBackground = now - lastVisibilityChangeRef.current;
        // Se esteve em segundo plano por mais de 1 segundo, atualizar
        if (timeInBackground > 1000) {
          updateElapsedTime();
        }
      } else {
        // Guardar timestamp quando vai para segundo plano
        lastVisibilityChangeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopNotification();
      hasTriggeredNotificationRef.current = false;
      notificationScheduledRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas na montagem inicial

  // Nota: Não precisamos de um useEffect separado para reagendar quando currentDuration muda
  // porque os handlers handleAddTime e handleSubtractTime já fazem isso corretamente

  // Função para parar vibração e som
  const stopNotification = () => {
    notificationClickedRef.current = true;
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    // Parar vibração atual
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // Listener para quando a notificação é clicada
  useEffect(() => {
    const handleNotificationClick = () => {
      stopNotification();
    };

    // Adicionar listener para cliques em notificações
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notificationclick') {
          handleNotificationClick();
        }
      });
    }

    // Listener para cliques em notificações do navegador
    if ('Notification' in window) {
      window.addEventListener('focus', () => {
        // Se a janela ganhar foco, pode ser que o utilizador clicou na notificação
        if (notificationClickedRef.current === false && elapsedTime >= currentDuration) {
          // Pequeno delay para garantir que foi um clique na notificação
          setTimeout(() => {
            if (document.hasFocus()) {
              stopNotification();
            }
          }, 100);
        }
      });
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleNotificationClick);
      }
    };
  }, [elapsedTime, currentDuration]);

  // Calcular tempo restante
  const remainingTime = Math.max(0, currentDuration - elapsedTime);

  // Um segundo useEffect para verificar se o tempo acabou.
  useEffect(() => {
    // Verificar se o tempo acabou e ainda não foi acionada a notificação
    if (elapsedTime >= currentDuration && !hasTriggeredNotificationRef.current) {
      hasTriggeredNotificationRef.current = true;
      notificationClickedRef.current = false;

      // Criar e tocar som usando Web Audio API para melhor compatibilidade
      const playSound = () => {
        try {
          // Tentar usar um ficheiro de som primeiro
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.8;
          audio.play().catch(() => {
            // Se falhar, criar um som sintético usando Web Audio API
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800; // Frequência do som
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) {
              logger.warn('Erro ao criar som sintético:', e);
            }
          });
        } catch (e) {
          logger.warn('Erro ao tocar som:', e);
        }
      };

      // Tocar som imediatamente
      playSound();

      // Tocar som a cada segundo durante 5 segundos
      let soundCount = 0;
      audioIntervalRef.current = setInterval(() => {
        if (notificationClickedRef.current || soundCount >= 4) {
          clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
          return;
        }
        playSound();
        soundCount++;
      }, 1000);

      // Vibração contínua durante 5 segundos
      const vibratePattern = [300, 100, 300, 100, 300, 100, 300];
      if (navigator.vibrate) {
        navigator.vibrate(vibratePattern);
        
        // Continuar vibração durante 5 segundos
        let vibrationCount = 0;
        vibrationIntervalRef.current = setInterval(() => {
          if (notificationClickedRef.current || vibrationCount >= 4) {
            clearInterval(vibrationIntervalRef.current);
            vibrationIntervalRef.current = null;
            if (navigator.vibrate) {
              navigator.vibrate(0);
            }
            return;
          }
          navigator.vibrate(vibratePattern);
          vibrationCount++;
        }, 1000);
      }

      // Mostrar notificação local apenas se não houver notificação push agendada
      // ou se a notificação push já foi exibida
      const notify = async () => {
        // Verificar se já existe uma notificação com a mesma tag
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && reg.getNotifications) {
              const existingNotifications = await reg.getNotifications({ tag: 'rest-timer' });
              // Se já existe uma notificação com a mesma tag, não criar outra
              if (existingNotifications.length > 0) {
                return;
              }
            }
          } catch (e) {
            // Continuar se houver erro
          }
        }

        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            let permission = Notification.permission;
            if (permission === 'default') {
              permission = await Notification.requestPermission();
            }
            if (permission === 'granted') {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg && reg.showNotification) {
                  await reg.showNotification('Descanso concluído', {
                    body: 'O seu tempo de descanso terminou. Vamos continuar? 💪',
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'rest-timer', // Tag única para evitar duplicados
                    requireInteraction: true,
                  });
                } else {
                  new Notification('Descanso concluído', { 
                    body: 'O seu tempo de descanso terminou.',
                    tag: 'rest-timer',
                    requireInteraction: true
                  });
                }
              } else {
                new Notification('Descanso concluído', { 
                  body: 'O seu tempo de descanso terminou.',
                  tag: 'rest-timer',
                  requireInteraction: true
                });
              }
            }
          }
        } catch (e) {
          logger.warn('Erro ao mostrar notificação:', e);
        }
      };
      notify();

      // Parar tudo após 5 segundos se não foi clicado
      setTimeout(() => {
        if (!notificationClickedRef.current) {
          stopNotification();
        }
      }, 5000);
    }
  }, [elapsedTime, currentDuration]);

  const handleAddTime = () => {
    const newDuration = currentDuration + 30;
    setCurrentDuration(newDuration);
    // Resetar flag de notificação se o novo tempo for maior que o tempo decorrido
    if (newDuration > elapsedTime) {
      hasTriggeredNotificationRef.current = false;
      notificationScheduledRef.current = false; // Permitir reagendar
    }
    // Reagenda notificação com novo tempo restante
    const remaining = Math.max(0, newDuration - elapsedTime);
    scheduleNotification(remaining);
  };

  const handleSubtractTime = () => {
    const newDuration = Math.max(30, currentDuration - 30); // Mínimo de 30 segundos
    setCurrentDuration(newDuration);
    // Resetar flag de notificação se o novo tempo for maior que o tempo decorrido
    if (newDuration > elapsedTime) {
      hasTriggeredNotificationRef.current = false;
      notificationScheduledRef.current = false; // Permitir reagendar
    }
    // Reagenda notificação com novo tempo restante
    const remaining = Math.max(0, newDuration - elapsedTime);
    scheduleNotification(remaining);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Se o tempo acabou, esconder o componente após alguns segundos
  useEffect(() => {
    if (remainingTime === 0) {
      // Aguardar alguns segundos para o utilizador ver a notificação, depois esconder
      const hideTimer = setTimeout(() => {
        onFinish();
      }, 5000); // Esconder após 5 segundos
      return () => clearTimeout(hideTimer);
    }
  }, [remainingTime, onFinish]);

  // Não renderizar se o tempo acabou e já passou o tempo de exibição
  if (remainingTime === 0) {
    return null;
  }

  return (
    <TimerContainer>
      <TimerTopRow>
        <TimerText>
          Descanso: {formatTime(remainingTime)}
        </TimerText>
        <CloseTimerButton onClick={onFinish} aria-label="Fechar cronómetro">
          <FaTimes />
        </CloseTimerButton>
      </TimerTopRow>
      <TimerControlsRow>
        <TimerControlButton 
          onClick={handleSubtractTime} 
          disabled={remainingTime <= 30}
          aria-label="Reduzir 30 segundos"
        >
          <FaMinus />
        </TimerControlButton>
        <TimerControlButton 
          onClick={handleAddTime}
          aria-label="Adicionar 30 segundos"
        >
          <FaPlus />
        </TimerControlButton>
      </TimerControlsRow>
    </TimerContainer>
  );
};

export default RestTimer;