// src/components/Workout/SetRow.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, updatePerformanceLogService, deleteExercisePerformanceLogService } from '../../services/progressService';
import { FaCheck, FaTimes, FaEdit, FaTrashAlt, FaSave } from 'react-icons/fa';

// --- Styled Components ---

const RowContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};

  &:last-of-type {
    border-bottom: none;
  }
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

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }
  
  &:disabled {
    background-color: #2c2c2c;
    color: ${({ theme }) => theme.colors.textMuted};
    border-color: #333;
    opacity: 0.7;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 105px;
  justify-content: flex-end;
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
      <ActionButton as="button" onClick={handleComplete} disabled={isLoading || isCompleted} style={{width: '45px', height: '45px', border: `2px solid ${'#4A4A4A'}`, borderRadius: '50%'}}>
        <FaCheck />
      </ActionButton>
    );
  };

  return (
    <RowContainer>
      <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
      <InputGroup>
        <Input type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} disabled={isCompleted && !isEditing} />
        <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} disabled={isCompleted && !isEditing} />
      </InputGroup>
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