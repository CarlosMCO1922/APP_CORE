// src/components/Workout/ExerciseLiveCard.js

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getMyPerformanceHistoryForExerciseService } from '../../services/progressService';
import { FaDumbbell, FaHistory } from 'react-icons/fa';
import SetRow from './SetRow';

const CardContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius};
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: ${({ theme }) => theme.boxShadow};
`;

const CardHeader = styled.div`
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const ExerciseName = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.6rem;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LastPerformance = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AddSetButton = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 8px 15px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  font-weight: 500;
  margin-top: 15px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;

const ExerciseLiveCard = ({ planExercise, trainingId, workoutPlanId, onSetComplete }) => {
  const { authState } = useAuth();
  const [sets, setSets] = useState([]);
  const [lastPerformance, setLastPerformance] = useState('A carregar histórico...');
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({
      id: i,
      setNumber: i + 1,
      prescribedReps: planExercise.reps,
      isCompleted: false,
      weight: '',
      reps: '',
    }));
    setSets(initialSets);
  }, [planExercise]);

  const fetchHistory = useCallback(async () => {
    if (!authState.token || !planExercise.id) return;
    try {
      const history = await getMyPerformanceHistoryForExerciseService(planExercise.id, authState.token);
      if (history && history.length > 0) {
        const lastSession = history[0];
        setLastPerformance(`Reps: ${lastSession.performedReps || '-'}, Peso: ${lastSession.performedWeight || '-'}kg`);
      } else {
        setLastPerformance('Ainda não há registos para este exercício.');
      }
    } catch (err) {
      setHistoryError('Não foi possível carregar o histórico.');
      console.error(err);
    }
  }, [authState.token, planExercise.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAddSet = () => {
    setSets(prevSets => [
      ...prevSets,
      {
        id: prevSets.length,
        setNumber: prevSets.length + 1,
        prescribedReps: planExercise.reps,
        isCompleted: false,
        weight: '',
        reps: '',
      }
    ]);
  };
  
  return (
    <CardContainer>
      <CardHeader>
        <ExerciseName><FaDumbbell /> {planExercise.exerciseDetails.name}</ExerciseName>
        <LastPerformance>
          <FaHistory /> {historyError || lastPerformance}
        </LastPerformance>
      </CardHeader>
      
      <div>
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            setNumber={set.setNumber}
            prescribedReps={set.prescribedReps}
            trainingId={trainingId}
            workoutPlanId={workoutPlanId}
            planExerciseId={planExercise.id}
            onSetComplete={onSetComplete}
            restSeconds={planExercise.restSeconds}
          />
        ))}
      </div>

      <AddSetButton onClick={handleAddSet}>+ Adicionar Série</AddSetButton>
    </CardContainer>
  );
};

export default ExerciseLiveCard;