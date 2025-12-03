// src/components/Workout/RestTimer.js

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
  // O estado agora é o tempo que já passou, começando em 0.
  const [elapsedTime, setElapsedTime] = useState(0);
  // Duração dinâmica que pode ser ajustada
  const [currentDuration, setCurrentDuration] = useState(duration);
  const intervalRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const notificationClickedRef = useRef(false);

  // Função para agendar/cancelar notificação
  const scheduleNotification = async (remainingSeconds) => {
    // Cancela notificação anterior se existir
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

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
          body: 'O seu tempo de descanso terminou. Vamos continuar? 💪'
        })
      }).catch((error) => {
        // Log erro mas não bloqueia a funcionalidade
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erro ao agendar notificação push:', error);
        }
      });
    } catch (e) {
      // Log erro mas não bloqueia a funcionalidade
      if (process.env.NODE_ENV === 'development') {
        console.warn('Erro ao configurar notificação push:', e);
      }
    }
  };

  // useEffect para inicializar o timer apenas uma vez
  useEffect(() => {
    // Agenda notificação inicial com o tempo total
    scheduleNotification(currentDuration);

    // Cria um intervalo que é executado a cada segundo.
    intervalRef.current = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

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
      stopNotification();
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

  // Um segundo useEffect para verificar se o tempo acabou.
  useEffect(() => {
    if (elapsedTime >= currentDuration) {
      notificationClickedRef.current = false;

      // Criar e tocar som
      const playSound = () => {
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.7;
          audio.play().catch((error) => {
            // Log erro mas não bloqueia a funcionalidade
            if (process.env.NODE_ENV === 'development') {
              console.warn('Erro ao tocar som de notificação:', error);
            }
          });
        } catch (e) {
          console.warn('Erro ao tocar som:', e);
        }
      };

      // Tocar som imediatamente
      playSound();

      // Tocar som a cada segundo durante 7 segundos
      let soundCount = 0;
      audioIntervalRef.current = setInterval(() => {
        if (notificationClickedRef.current || soundCount >= 6) {
          clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
          return;
        }
        playSound();
        soundCount++;
      }, 1000);

      // Vibração contínua durante 7 segundos
      const vibratePattern = [200, 100, 200, 100, 200, 100, 200, 100, 200, 100, 200, 100, 200];
      if (navigator.vibrate) {
        navigator.vibrate(vibratePattern);
        
        // Continuar vibração durante 7 segundos
        let vibrationCount = 0;
        vibrationIntervalRef.current = setInterval(() => {
          if (notificationClickedRef.current || vibrationCount >= 6) {
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

      const notify = async () => {
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
                  const notification = await reg.showNotification('Descanso concluído', {
                    body: 'O seu tempo de descanso terminou. Vamos continuar? 💪',
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'rest-timer',
                    requireInteraction: true, // Mantém a notificação visível até interação
                  });
                  
                  // Listener para quando a notificação é clicada
                  notification.onclick = () => {
                    stopNotification();
                  };
                } else {
                  const notification = new Notification('Descanso concluído', { 
                    body: 'O seu tempo de descanso terminou.',
                    requireInteraction: true
                  });
                  notification.onclick = () => {
                    stopNotification();
                  };
                }
              } else {
                const notification = new Notification('Descanso concluído', { 
                  body: 'O seu tempo de descanso terminou.',
                  requireInteraction: true
                });
                notification.onclick = () => {
                  stopNotification();
                };
              }
            }
          }
        } catch (e) {
          console.warn('Erro ao mostrar notificação:', e);
        }
      };
      notify();

      // Parar tudo após 7 segundos se não foi clicado
      setTimeout(() => {
        if (!notificationClickedRef.current) {
          stopNotification();
        }
      }, 7000);
    }
  }, [elapsedTime, currentDuration]);

  const handleAddTime = () => {
    const newDuration = currentDuration + 30;
    setCurrentDuration(newDuration);
    // Reagenda notificação com novo tempo restante
    const remaining = Math.max(0, newDuration - elapsedTime);
    scheduleNotification(remaining);
  };

  const handleSubtractTime = () => {
    const newDuration = Math.max(30, currentDuration - 30); // Mínimo de 30 segundos
    setCurrentDuration(newDuration);
    // Reagenda notificação com novo tempo restante
    const remaining = Math.max(0, newDuration - elapsedTime);
    scheduleNotification(remaining);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, currentDuration - elapsedTime);

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