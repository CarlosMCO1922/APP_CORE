// src/components/Workout/SetRow.js - VERSÃO POLIDA E INTUITIVA

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, deleteExercisePerformanceLogService } from '../../services/progressService';
import { FaCheck, FaTimes, FaDumbbell } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';

// --- Keyframes para animação de shake (se a ação falhar ou for inválida) ---
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
`;

// --- Styled Components ATUALIZADOS ---

const SwipeableRowContainer = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 8px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
`;

const ActionBackground = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px; /* Largura da área de ação visível */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ textColor }) => textColor};
  z-index: 1;
  background-color: ${({ color }) => color};
  
  ${({ side }) => side === 'left' ? 'left: 0;' : 'right: 0;'}
`;

const ActionText = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const SwipeableContent = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  position: relative;
  z-index: 2; /* Fica SEMPRE por cima das ações de fundo */
  cursor: grab;
  transition: transform 0.3s ease-out;
  
  ${({ isSwiping, transformX }) => isSwiping && `
    cursor: grabbing;
    transform: translateX(${transformX}px);
    transition: none;
  `}
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

// --- Componente SetRow ---
const SetRow = ({
  setId, setNumber, onSetComplete, trainingId, workoutPlanId, planExerciseId,
  restSeconds, lastWeight, lastReps, onLogDeleted,
  onDuplicateSet, 
  initialWeight, 
  initialReps    
}) => {
  const { authState } = useAuth();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedLog, setCompletedLog] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [transformX, setTransformX] = useState(0); // Para controlar a posição do swipe
  const [isLoading, setIsLoading] = useState(false);
  const [animateShake, setAnimateShake] = useState(false);

  const SWIPE_THRESHOLD = 90; // Aumentei o limiar para um deslize maior
  
  const handleClear = () => {
    setWeight('');
    setReps('');
    resetSwipe();
  };

  const handleDuplicate = () => {
    onDuplicateSet(weight, reps);
    resetSwipe();
  };

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
    setIsSwiping(false);
  };

  const handleUndoComplete = async () => {
    if (!completedLog) {
        setAnimateShake(true); // Animação de shake se não houver log para desfazer
        setTimeout(() => setAnimateShake(false), 500);
        return;
    }
    try {
      await deleteExercisePerformanceLogService(completedLog.id, authState.token);
      onLogDeleted(completedLog.id);
      setIsCompleted(false);
      setCompletedLog(null);
      // Redefinir para os últimos valores ou vazio
      setWeight(lastWeight || '');
      setReps(lastReps || '');
    } catch(err) {
      alert("Falha ao desfazer a série.");
    } finally {
      resetSwipe();
    }
  };

  const handleMarkAsFailure = async () => {
    if (!completedLog) {
        setAnimateShake(true); // Animação de shake se não houver log para marcar
        setTimeout(() => setAnimateShake(false), 500);
        return;
    }
    console.log(`Marcando a série ${completedLog.id} como 'Até à Falha'`);
    // Aqui você faria uma chamada à API para atualizar o 'set'
    // Exemplo: await updatePerformanceLogService(completedLog.id, { setToFailure: true }, authState.token);
    alert('Funcionalidade "Falha" ainda não implementada com API.'); // Feedback temporário
    resetSwipe();
  };

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      // SÓ PERMITE deslizar se a série NÃO estiver completa
      if (isCompleted || isLoading) return;
      setTransformX(eventData.deltaX);
    },
    onSwiped: (eventData) => {
      if (isCompleted) return;
      if (eventData.deltaX > SWIPE_THRESHOLD) { // Deslizar para a direita -> Limpar
        handleClear();
      } else if (eventData.deltaX < -SWIPE_THRESHOLD) { // Deslizar para a esquerda -> Duplicar
        handleDuplicate();
      } else {
        resetSwipe(); // Volta ao centro se não deslizar o suficiente
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  const handleComplete = async () => {
    if (!weight && !reps) {
        setAnimateShake(true);
        setTimeout(() => setAnimateShake(false), 500);
        alert("Por favor, preencha o peso ou as repetições.");
        return;
    }

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
    <SwipeableRowContainer>
      {/* As duas ações de fundo, agora corretamente configuradas */}
      <ActionBackground side="left" color="#D32F2F" textColor="white">
        <FaTimes />
      </ActionBackground>
      <ActionBackground side="right" color={({ theme }) => theme.colors.primary} textColor={({ theme }) => theme.colors.textDark}>
        <ActionText>x2</ActionText>
      </ActionBackground>

      <SwipeableContent {...handlers} transformX={transformX} isCompleted={isCompleted}>
        <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
        
        {isCompleted ? (
          <>
            <CompletedText>{completedLog?.performedWeight || weight || '-'} kg</CompletedText>
            <CompletedText>{completedLog?.performedReps || reps || '-'}</CompletedText>
          </>
        ) : (
          <>
            <Input type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} disabled={isLoading} />
            <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} disabled={isLoading} />
          </>
        )}
        
        <div>
          {isCompleted ? (
             <ActionButton disabled style={{ backgroundColor: 'transparent', color: '#4CAF50' }}>
               <FaCheck />
             </ActionButton>
          ) : (
            <ActionButton onClick={handleComplete} disabled={isLoading || (!weight && !reps)}>
              {isLoading ? <FaDumbbell /> : <FaCheck />}
            </ActionButton>
          )}
        </div>
      </SwipeableContent>
    </SwipeableRowContainer>
  );
};

export default SetRow;