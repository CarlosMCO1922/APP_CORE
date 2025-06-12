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

const RestTimer = ({ duration, onFinish }) => {
  // O estado agora é o tempo que já passou, começando em 0.
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Cria um intervalo que é executado a cada segundo.
    const intervalId = setInterval(() => {
      // Usa a forma funcional para garantir que temos sempre o valor mais recente.
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    // Função de limpeza que é chamada quando o componente é removido da tela.
    return () => clearInterval(intervalId);
  }, []); // A lista de dependências está VAZIA, para o efeito correr só uma vez.

  // Um segundo useEffect para verificar se o tempo acabou.
  // Isto é mais limpo e seguro do que colocar a lógica dentro do setInterval.
  useEffect(() => {
    if (elapsedTime >= duration) {
      const audio = new Audio('/notification-sound.mp3'); // Opcional
      audio.play().catch(e => console.warn("Não foi possível tocar o som:", e));
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