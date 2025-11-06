// src/components/Workout/RestTimer.js

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes } from 'react-icons/fa';

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
  justify-content: space-between;
  align-items: center;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
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

  useEffect(() => {
    // Cria um intervalo que é executado a cada segundo.
    const intervalId = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    // Tenta subscrever push e agendar notificação de background
    (async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const regs = await navigator.serviceWorker.getRegistrations();
        const notifReg = regs.find(r => r.active && r.active.scriptURL.includes('notifications-sw.js')) || (await navigator.serviceWorker.register('/notifications-sw.js'));
        if (!notifReg) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return; // sem chave não subscrevemos
        const sub = await notifReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });

        const remaining = Math.max(0, duration);
        fetch(`${API_URL}/push/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            delaySeconds: remaining,
            title: 'Descanso concluído',
            body: 'O seu tempo de descanso terminou. Vamos continuar? 💪'
          })
        }).catch(() => {});
      } catch (e) {
        // silencioso
      }
    })();

    return () => clearInterval(intervalId);
  }, [duration]);

  // Um segundo useEffect para verificar se o tempo acabou.
  // Isto é mais limpo e seguro do que colocar a lógica dentro do setInterval.
  useEffect(() => {
    if (elapsedTime >= duration) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {});

      const notify = async () => {
        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            let permission = Notification.permission;
            if (permission === 'default') {
              permission = await Notification.requestPermission();
            }
            if (permission === 'granted') {
              // Tenta usar o SW (se registado) para melhor suporte mobile
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg && reg.showNotification) {
                  reg.showNotification('Descanso concluído', {
                    body: 'O seu tempo de descanso terminou. Vamos continuar? 💪',
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'rest-timer',
                  });
                } else {
                  new Notification('Descanso concluído', { body: 'O seu tempo de descanso terminou.' });
                }
              } else {
                new Notification('Descanso concluído', { body: 'O seu tempo de descanso terminou.' });
              }
            }
          }
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch {}
      };
      notify();

      onFinish();
    }
  }, [elapsedTime, duration, onFinish]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <TimerContainer>
      <TimerText>
        Descanso: {formatTime(elapsedTime)} / {formatTime(duration)}
      </TimerText>
      <CloseTimerButton onClick={onFinish} aria-label="Fechar cronómetro">
        <FaTimes />
      </CloseTimerButton>
    </TimerContainer>
  );
};

export default RestTimer;