// src/components/Workout/ExerciseLiveCard.js - COM MENU "..."

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getMyPerformanceHistoryForExerciseService } from '../../services/progressService';
import { FaPlus, FaEllipsisH, FaHistory } from 'react-icons/fa';
import SetRow from './SetRow';

// --- Styled Components ---
const CardContainer = styled.div` margin-bottom: 40px; `;
const CardHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; `;
const ExerciseName = styled.h2` color: ${({ theme }) => theme.colors.textMain}; font-size: 1.3rem; margin: 0; cursor: pointer; &:hover { color: ${({ theme }) => theme.colors.primary}; } `;
const SetsGridHeader = styled.div` display: grid; grid-template-columns: 50px 1fr 1fr 60px; gap: 10px; padding: 0 10px; margin-bottom: 8px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; text-align: center; span:first-child { text-align: left; }`;
const AddSetButton = styled.button` background-color: transparent; color: ${({ theme }) => theme.colors.textMuted}; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; margin-top: 15px; transition: all 0.2s; display: block; width: 100%; text-align: center; &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.primary}; }`;
const LastPerformance = styled.p` font-size: 0.8rem; color: ${({ theme }) => theme.colors.textMuted}; margin-top: -10px; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; `;

const MoreActionsButton = styled.button`
  background: none; border: none; color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.2rem; cursor: pointer; padding: 5px; border-radius: 50%;
  &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.primary}; }
`;

const DropdownMenu = styled.div`
  position: absolute; right: 0; top: 30px;
  background-color: #1F1F1F;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10; overflow: hidden;
  button {
    display: block; width: 100%; text-align: left; background: none; border: none;
    color: ${({ theme }) => theme.colors.textMain}; padding: 10px 15px; font-size: 0.9rem;
    cursor: pointer; &:hover { background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; }
  }
`;

const ExerciseLiveCard = ({ 
  planExercise, 
  trainingId, 
  workoutPlanId, // <-- Prop nova
  onSetComplete, 
  lastPerformance,
}) => {
  const [sets, setSets] = useState([]);
  const [lastPerformanceText, setLastPerformanceText] = useState('Sem registos anteriores.');
  
  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({ id: `initial-${i}` }));
    setSets(initialSets);
  }, [planExercise]);
  
  const handleAddSet = () => setSets(prev => [...prev, { id: Date.now() }]);
  const handleDeleteSet = (setIdToDelete) => setSets(prev => prev.filter(set => set.id !== setIdToDelete));

  return (
    <CardContainer>
      {/* O Header e os botões de ação foram removidos daqui e movidos para a página principal */}
      <LastPerformance>{lastPerformanceText}</LastPerformance>
      
      <SetsGridHeader><span>Série</span><span>KG</span><span>Reps</span><span></span></SetsGridHeader>
      
      <div>
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            setId={set.id}
            setNumber={index + 1}
            planExerciseId={planExercise.id}
            trainingId={trainingId} 
            workoutPlanId={workoutPlanId} 
            onSetComplete={onSetComplete}
            restSeconds={planExercise.restSeconds}
            onDeleteSet={() => handleDeleteSet(set.id)}
            lastWeight={lastPerformance?.performedWeight}
            lastReps={lastPerformance?.performedReps}
          />
        ))}
      </div>

      <AddSetButton onClick={handleAddSet}><FaPlus /> Adicionar Série ({planExercise.restSeconds || 90}s)</AddSetButton>
    </CardContainer>
  );
};

export default ExerciseLiveCard;