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
  const { token } = useAuth();
  const [lastPerformanceText, setLastPerformanceText] = useState('Sem registos anteriores.');
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({ id: `initial-${i}` }));
    setSets(initialSets);
  }, [planExercise.sets]);

   useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!planExercise?.id || !token) return;

        const data = await getMyPerformanceHistoryForExerciseService(planExercise.id, token);
        if (!data || data.length === 0) {
          setHistory([]);
          setLastPerformanceText('Sem registos anteriores.');
          return;
        }

        // Ordenar e garantir que o mais recente está primeiro
        const ts = v => (typeof v === 'number' ? v : new Date(v).getTime());
        const ordered = [...data].sort((a, b) => ts(b.performedAt) - ts(a.performedAt));
        const last = ordered[0]; // o registo mais recente

        setHistory(ordered.slice(0, 3));
        setLastPerformanceText(
          `Último: ${Number(last.weightKg || last.performedWeight).toFixed(2)} kg × ${last.reps || last.performedReps} reps`
        );
      } catch (err) {
        console.error('Erro ao buscar histórico', err);
        setLastPerformanceText('Sem registos anteriores.');
      }
    };

    fetchHistory();
  }, [planExercise?.id, token]);
  
  const handleAddSet = () => setSets(prev => [...prev, { id: Date.now() }]);

  const handleDeleteSet = (indexToDelete) => {
    if (sets.length <= 1) {
        alert("Não pode remover todas as séries.");
        return;
    }
    setSets(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  return (
    <CardContainer>
      <LastPerformance><FaHistory /> {lastPerformanceText}</LastPerformance>
      
      <SetsGridHeader><span>Série</span><span>KG</span><span>Reps</span><span></span></SetsGridHeader>
      
      <div>
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            setNumber={index + 1}
            planExerciseId={planExercise.id}
            trainingId={trainingId} 
            workoutPlanId={workoutPlanId} 
            onSetComplete={onSetComplete}
            restSeconds={planExercise.restSeconds}
            onDeleteSet={() => handleDeleteSet(index)} 
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