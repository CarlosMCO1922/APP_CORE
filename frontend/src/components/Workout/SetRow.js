// src/components/Workout/SetRow.js - VERSÃO CORRIGIDA E SIMPLIFICADA

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, deleteExercisePerformanceLogService } from '../../services/progressService';
import { FaCheck, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';

// --- Styled Components ---

const SwipeableRow = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 8px; /* Adicionado para espaçamento */
`;

const ActionBackground = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  display: flex;
  flex-direction: column; /* Para texto e ícone */
  align-items: center;
  justify-content: center;
  color: white;
  
  span {
    font-size: 0.8rem;
    margin-top: 5px;
  }
  
  svg {
    font-size: 1.5rem;
  }
  
  ${({ side }) => side === 'left' ? 'left: 0;' : 'right: 0;'}
  background-color: ${({ color }) => color};
`;

const SwipeableContent = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px; /* Ajustado para um botão */
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: transform 0.3s ease;
  background-color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.cardBackground : 'transparent'};
  position: relative;
  z-index: 2;
  
  ${({ isSwiping }) => isSwiping && 'box-shadow: 0 5px 15px rgba(0,0,0,0.3);'}
`;

const SetLabel = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.primary : theme.colors.textMuted};
  text-align: left;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  text-align: center;
  font-size: 1rem;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
    -webkit-appearance: none; margin: 0;
  }
`;

const CompletedText = styled.span`
    text-align: center;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMain};
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SetRow = ({ setId, setNumber, onSetComplete, trainingId, workoutPlanId, planExerciseId, restSeconds, lastWeight, lastReps, onDeleteSet, onLogDeleted }) => {
  const { authState } = useAuth();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedLog, setCompletedLog] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- ESTADO ADICIONADO

  const SWIPE_THRESHOLD = 80;

  useEffect(() => {
    // Apenas atualiza os campos se a série não estiver completa
    // e se o peso/reps do histórico forem diferentes dos atuais
    if (!isCompleted && (weight !== lastWeight || reps !== lastReps)) {
        setWeight(lastWeight || '');
        setReps(lastReps || '');
    }
  }, [lastWeight, lastReps, isCompleted]);

  const handleUndoComplete = async () => {
    if (!completedLog) return;
    try {
        await deleteExercisePerformanceLogService(completedLog.id, authState.token);
        onLogDeleted(completedLog.id);
        setIsCompleted(false);
        setCompletedLog(null);
    } catch(err) {
        alert("Falha ao desfazer a série.");
    }
  };

  const handleMarkAsFailure = async () => {
    if (!completedLog) return;
    console.log(`Marcando a série ${completedLog.id} como 'Até à Falha'`);
    // Lógica para a API aqui, por exemplo:
    // await updatePerformanceLogService(completedLog.id, { setToFailure: true }, authState.token);
  };

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if(!isCompleted || isSwiping) return;
      setIsSwiping(true);
      const content = eventData.event.currentTarget.querySelector('.swipe-content');
      if (content) {
        content.style.transition = 'none';
        content.style.transform = `translateX(${eventData.deltaX}px)`;
      }
    },
    onSwiped: (eventData) => {
      setIsSwiping(false);
      const content = eventData.event.currentTarget.querySelector('.swipe-content');
      if (content) {
        content.style.transition = 'transform 0.3s ease';
        if (eventData.deltaX > SWIPE_THRESHOLD) {
          handleUndoComplete();
          content.style.transform = 'translateX(0)';
        } else if (eventData.deltaX < -SWIPE_THRESHOLD) {
          handleMarkAsFailure();
          setTimeout(() => { content.style.transform = 'translateX(0)'; }, 300);
        } else {
          content.style.transform = 'translateX(0)';
        }
      }
    },
    trackMouse: true,
  });

  const handleComplete = async () => {
    setIsLoading(true);
    const performanceData = {
      trainingId: trainingId || null, workoutPlanId, planExerciseId,
      performedAt: new Date().toISOString(), setNumber,
      performedReps: reps ? parseInt(reps, 10) : null,
      performedWeight: weight ? parseFloat(weight) : null,
    };
    try {
      const result = await logExercisePerformanceService(performanceData, authState.token);
      setCompletedLog(result.performance);
      setIsCompleted(true);
      onSetComplete(result.performance, restSeconds);
    } catch (error) {
      alert(`Falha ao registar a série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SwipeableRow {...handlers}>
      <ActionBackground side="left" color="#D32F2F">
        <FaRedo />
        <span>Desfazer</span>
      </ActionBackground>
      <ActionBackground side="right" color="#1976D2">
        <FaExclamationTriangle />
        <span>Falha</span>
      </ActionBackground>

      <SwipeableContent className="swipe-content" isCompleted={isCompleted} isSwiping={isSwiping}>
        <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
        
        {isCompleted ? (
          <>
            <CompletedText>{completedLog?.performedWeight || weight || '-'} kg</CompletedText>
            <CompletedText>{completedLog?.performedReps || reps || '-'}</CompletedText>
          </>
        ) : (
          <>
            <Input type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
            <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} />
          </>
        )}
        
        <div>
          {!isCompleted && (
            <ActionButton onClick={handleComplete} disabled={isLoading}>
              <FaCheck />
            </ActionButton>
          )}
        </div>
      </SwipeableContent>
    </SwipeableRow>
  );
};

export default SetRow;