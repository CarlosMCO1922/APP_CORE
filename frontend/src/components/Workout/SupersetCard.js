import React from 'react';
import styled from 'styled-components';
import { FaLink, FaHistory, FaEllipsisV } from 'react-icons/fa';
import ExerciseLiveCard from './ExerciseLiveCard'; // Vamos usar o ExerciseLiveCard para consistência

// --- Styled Components ---
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
`;

const ExerciseWrapper = styled.div`
  position: relative;
  /* Adiciona uma linha de separação subtil entre os exercícios da superset */
  &:not(:last-child) {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px dashed ${({ theme }) => theme.colors.cardBorder};
  }
`;

const ExerciseActions = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: grey;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  display: flex;
  align-items: center;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SupersetCard = ({ exercises = [], onSetComplete, onShowHistory }) => {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return null;
  }

  return (
    <SupersetContainer>
      <SupersetHeader>
        <FaLink />
        <SupersetTitle>Superset</SupersetTitle>
      </SupersetHeader>
      
      {/* O .map() agora é seguro porque 'exercises' será sempre uma lista */}
      {exercises.map((planExercise) => (
        <ExerciseWrapper key={planExercise.id}>
          <ExerciseLiveCard
            planExercise={planExercise}
            onSetComplete={onSetComplete}
          />
          <ExerciseActions>
            <ActionButton 
              onClick={() => onShowHistory && onShowHistory(planExercise.exerciseDetails)} 
              title="Ver Histórico do Exercício"
            >
              <FaHistory />
            </ActionButton>
            <ActionButton onClick={() => alert(`Menu de opções para ${planExercise.exerciseDetails.name}`)} title="Opções">
              <FaEllipsisV />
            </ActionButton>
          </ExerciseActions>
        </ExerciseWrapper>
      ))}
    </SupersetContainer>
  );
};

export default SupersetCard;