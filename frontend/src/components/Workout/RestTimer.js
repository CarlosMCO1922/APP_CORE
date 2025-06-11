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
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Tocar um som
      const audio = new Audio('/notification-sound.mp3'); // Adiciona um som na pasta /public
      audio.play().catch(e => console.log("Não foi possível tocar o som:", e));
      onFinish();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onFinish]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <TimerContainer>
      <TimerText>Descanso: {formatTime(timeLeft)}</TimerText>
      <CloseTimerButton onClick={onFinish} aria-label="Fechar cronómetro">
        <FaTimes />
      </CloseTimerButton>
    </TimerContainer>
  );
};

export default RestTimer;