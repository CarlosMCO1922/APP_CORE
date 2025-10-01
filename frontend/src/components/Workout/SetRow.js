// src/components/Workout/SetRow.js - VERSÃO POLIDA E INTUITIVA
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService } from '../../services/progressService';
import { FaCheck, FaTrashAlt } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';

// --- Keyframes para animação de shake (se a ação falhar ou for inválida) ---
const SwipeableRowContainer = styled.div`
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ActionBackground = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Ícone fica à direita */
  padding-right: 30px;
  color: white;
  background-color: #D32F2F;
  border-radius: ${({ theme }) => theme.borderRadius};
  z-index: 1;
`;


const ActionText = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const SwipeableContent = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 2px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  position: relative;
  z-index: 2;
  cursor: grab;
  transition: transform 0.3s ease-out;
  transform: translateX(${({ transformX }) => transformX}px);
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
  background-color: ${({ theme }) => theme.colors.inputBackground}; /* MUDOU */
  border: 1px solid ${({ theme }) => theme.colors.inputBorder}; /* MUDOU */
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

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 10px;
  
  &:hover {
    transform: scale(1.1);
  }
`;

// --- Componente SetRow ---
const SetRow = ({ setId, setNumber, onDeleteSet, onSetComplete, lastWeight, lastReps, planExerciseId, trainingId, workoutPlanId, restSeconds }) => {
  const { authState } = useAuth();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [isCompleted, setIsCompleted] = useState(false);
  const [transformX, setTransformX] = useState(0);

  useEffect(() => {
    if (lastWeight !== undefined && lastReps !== undefined) {
      // Se a série já foi completada, não redefina os valores
      if (!isCompleted) {
        setWeight(lastWeight);
        setReps(lastReps);
      }
    }
  }, [lastWeight, lastReps, isCompleted]);

  const resetSwipe = () => {
    setTransformX(0);
  };

  const handleComplete = async () => {
    if (isCompleted || (!weight && !reps)) return;
    const performanceData = {
      trainingId: trainingId || null, workoutPlanId, planExerciseId,
      performedAt: new Date().toISOString(), setNumber,
      performedReps: reps ? parseInt(reps, 10) : null,
      performedWeight: weight ? parseFloat(weight) : null,
    };
    try {
      const result = await logExercisePerformanceService(performanceData, authState.token);
      setIsCompleted(true);
      if (onSetComplete) onSetComplete(result.performance, restSeconds);
    } catch (error) {
      alert(`Falha ao registar a série: ${error.message}`);
    }
  };

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.deltaX < 0) { setTransformX(eventData.deltaX); }
    },
    onSwipedLeft: () => {
      // SWIPE COMPLETO: aciona a ação diretamente
      if (window.confirm("Tem a certeza que quer apagar esta série?")) {
        onDeleteSet();
      }
      // Animação de volta à posição inicial
      setTimeout(() => setTransformX(0), 100);
    },
    onSwiped: () => {
      // Se não acionou a ação, volta ao início
      if (transformX !== 0) {
        setTransformX(0);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  
  return (
    <SwipeableRowContainer>
      <ActionBackground>
        <FaTrashAlt />
      </ActionBackground>

      <SwipeableContent {...handlers} transformX={transformX} isCompleted={isCompleted}>
        <SetLabel>{setNumber}</SetLabel>
        <Input type="number" placeholder="-" value={weight} onChange={e => setWeight(e.target.value)} disabled={isCompleted} />
        <Input type="number" placeholder="-" value={reps} onChange={e => setReps(e.target.value)} disabled={isCompleted} />
        <ActionButton onClick={handleComplete} isCompleted={isCompleted} disabled={isCompleted || (!weight && !reps)}>
          <FaCheck />
        </ActionButton>
      </SwipeableContent>
    </SwipeableRowContainer>
  );
};

export default SetRow;