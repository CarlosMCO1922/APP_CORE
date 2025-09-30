// src/components/Workout/SetRow.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, updatePerformanceLogService, deleteExercisePerformanceLogService } from '../../services/progressService';
import { FaCheck, FaTimes, FaEdit, FaTrashAlt, FaSave } from 'react-icons/fa';

// --- Styled Components ---

const RowContainer = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 105px;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  background-color: ${props => props.isCompleted ? '#292929' : 'transparent'};

  &:hover {
    background-color: ${props => props.isCompleted ? '#292929' : '#303030'};
  }
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
  background-color: ${({ theme }) => theme.colors.backgroundSelect};}
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  text-align: center;
  font-size: 1rem;
  -moz-appearance: textfield; // Esconde setas em Firefox
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &:disabled {
      background-color: #2c2c2c;
      cursor: not-allowed;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #333;
    color: ${({ theme, color }) => color || theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;


const SetRow = ({ setId, setNumber, onSetComplete, trainingId, workoutPlanId, planExerciseId, restSeconds, lastWeight, lastReps, onDeleteSet, onLogDeleted }) => {
  const { authState } = useAuth();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [completedLog, setCompletedLog] = useState(null);

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
      setCompletedLog(result.performance);
      setIsCompleted(true);
      onSetComplete(result.performance, restSeconds);
    } catch (error) {
      alert(`Falha ao registar a série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!completedLog) return;
    setIsLoading(true);
    try {
      const dataToUpdate = {
        performedReps: reps ? parseInt(reps, 10) : null,
        performedWeight: weight ? parseFloat(weight) : null,
      };
      const result = await updatePerformanceLogService(completedLog.id, dataToUpdate, authState.token);
      setCompletedLog(result.performance);
      setIsEditing(false); 
    } catch (error) {
      alert(`Falha ao atualizar a série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!completedLog || !window.confirm("Tem a certeza que quer apagar este registo?")) return;
    setIsLoading(true);
    try {
      await deleteExercisePerformanceLogService(completedLog.id, authState.token);
      onLogDeleted(completedLog.id); 
    } catch (error) {
      alert(`Falha ao apagar a série: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setWeight(completedLog.performedWeight || '');
    setReps(completedLog.performedReps || '');
    setIsEditing(false);
  };

  const renderActions = () => {
    if (isEditing) {
      return (
        <>
          <ActionButton onClick={handleUpdate} disabled={isLoading} color="#66BB6A" title="Guardar Alterações"> <FaSave /> </ActionButton>
          <ActionButton onClick={handleCancelEdit} disabled={isLoading} color="#FF6B6B" title="Cancelar Edição"> <FaTimes /> </ActionButton>
        </>
      );
    }

    if (isCompleted) {
      return (
        <>
          <ActionButton onClick={() => setIsEditing(true)} disabled={isLoading} title="Editar Série"> <FaEdit /> </ActionButton>
          <ActionButton onClick={handleDelete} disabled={isLoading} color="#FF6B6B" title="Apagar Série"> <FaTrashAlt /> </ActionButton>
        </>
      );
    }
    return (
      <ActionButton as="button" onClick={handleComplete} disabled={isLoading || isCompleted} style={{ borderRadius: '50%'}}>
        <FaCheck />
      </ActionButton>
    );
  };

  return (
    <RowContainer>
      <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
      <Input type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} disabled={isCompleted && !isEditing} />
      <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} disabled={isCompleted && !isEditing} />
      <ActionsContainer>
        {renderActions()}
        {!isCompleted && (
          <DeleteButton onClick={() => onDeleteSet(setId)} title="Eliminar Série" disabled={isLoading}>
            <FaTimes />
          </DeleteButton>
        )}
      </ActionsContainer>
    </RowContainer>
  );
};

export default SetRow;