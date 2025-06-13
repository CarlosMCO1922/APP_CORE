// src/components/Workout/SetRow.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService } from '../../services/progressService';
import { FaCheck, FaTimes } from 'react-icons/fa';

// --- Styled Components --- (O teu código aqui mantém-se igual)
const RowContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  &:last-of-type { border-bottom: none; }
`;
const SetLabel = styled.span`
  font-weight: 600;
  color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.primary : theme.colors.textMuted};
  min-width: 60px;
  text-align: center;
  transition: color 0.3s;
`;
const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex-grow: 1;
  gap: 10px;
`;
const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: #383838;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  text-align: center;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
  &:disabled { background-color: #2c2c2c; color: ${({ theme }) => theme.colors.textMuted}; border-color: #333; opacity: 0.7; }
`;
const CheckButton = styled.button`
  width: 45px; height: 45px; border-radius: 50%;
  border: 2px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.cardBorder};
  background-color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : 'transparent'};
  color: ${({ theme, isCompleted }) => isCompleted ? 'white' : theme.colors.textMuted};
  font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease-in-out; flex-shrink: 0;
  &:hover:not(:disabled) { border-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.primary}; }
  &:disabled { cursor: not-allowed; }
`;
const DeleteButton = styled.button`
  background: transparent; border: none; color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1rem; cursor: pointer; padding: 5px; display: flex;
  align-items: center; justify-content: center; margin-left: 5px; transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.error}; }
`;
// --- Fim dos Styled Components ---

const SetRow = ({ setId, setNumber, prescribedReps, onSetComplete, trainingId, workoutPlanId, planExerciseId, restSeconds, lastWeight, lastReps, onDeleteSet }) => {
  const { authState } = useAuth();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isCompleted) {
        setWeight(lastWeight || '');
        setReps(lastReps || '');
    }
  }, [lastWeight, lastReps, isCompleted]);
  
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
      setIsCompleted(true);
      onSetComplete(result.performance, restSeconds);
    } catch (error) {
      console.error("Erro ao registar série:", error);
      alert(`Falha ao registar a série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RowContainer>
      <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
      <InputGroup>
        <Input
          type="number"
          placeholder="Peso"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={isCompleted || isLoading}
        />
        <Input
          type="number"
          placeholder={prescribedReps ? `(${prescribedReps})` : "Reps"}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          disabled={isCompleted || isLoading}
        />
      </InputGroup>
      <CheckButton onClick={handleComplete} isCompleted={isCompleted} disabled={isCompleted || isLoading}>
        {isCompleted ? <FaCheck /> : ''}
      </CheckButton>
      {!isCompleted && (
        <DeleteButton onClick={() => onDeleteSet(setId)} title="Eliminar Série" disabled={isLoading}>
          <FaTimes />
        </DeleteButton>
      )}
    </RowContainer>
  );
};

export default SetRow;