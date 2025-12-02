// src/components/Workout/SupersetCard.js
import React from 'react';
import styled from 'styled-components';
import { FaLink, FaHistory } from 'react-icons/fa';
import ExerciseLiveCard from './ExerciseLiveCard';

// --- Styled Components (sem alterações) ---
const SupersetContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;
const SupersetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.primary};
`;
const SupersetTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  line-height: 1.4;
`;
const ExerciseWrapper = styled.div`
  position: relative;
  &:not(:last-child) {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px dashed ${({ theme }) => theme.colors.cardBorder};
  }
`;
const ExerciseActions = styled.div`
  position: absolute;
  top: -5px;
  right: 0;
  display: flex;
  gap: 15px;
  align-items: center;
`;
const ActionButton = styled.button`
  background: transparent; border: none; color: grey;
  cursor: pointer; font-size: 1.2rem; padding: 5px;
  display: flex; align-items: center;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const SupersetCard = ({ exercises = [], onSetComplete, onShowHistory, trainingId, workoutPlanId, lastPerformances }) => {

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return null;
  }

  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

  const supersetTitle = sortedExercises
    .map(ex => ex.exerciseDetails.name)
    .join(' + ');

  // Dividir o título da supersérie para extrair nomes individuais
  const exerciseNames = supersetTitle.split(' + ').map(name => name.trim());

  return (
    <SupersetContainer>
      <SupersetHeader>
        <FaLink />
        <SupersetTitle>{supersetTitle}</SupersetTitle>
      </SupersetHeader>
      
      {sortedExercises.map((planExercise, index) => {
        // Usar o nome do array dividido (antes do "+" para o primeiro, depois do "+" para o segundo)
        const exerciseName = exerciseNames[index] || planExercise.exerciseDetails?.name || '';
        
        return (
          <ExerciseWrapper key={planExercise.id}>
            <ExerciseActions>
                <ActionButton onClick={() => onShowHistory(planExercise.exerciseDetails)} title="Ver Histórico"><FaHistory /></ActionButton>
            </ExerciseActions>
            <ExerciseLiveCard
              planExercise={planExercise}
              exerciseName={exerciseName}
              onSetComplete={onSetComplete}
              trainingId={trainingId}
              workoutPlanId={workoutPlanId}
              lastPerformance={lastPerformances[planExercise.exerciseDetails.id]}
            />
          </ExerciseWrapper>
        );
      })}
    </SupersetContainer>
  );
};

export default SupersetCard;