// src/components/Workout/ExerciseLiveCard.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEllipsisH } from 'react-icons/fa';
import SetRow from './SetRow';
import { useAuth } from '../../context/AuthContext';
import { getMyPerformanceHistoryForExerciseService } from '../../services/progressService';


const CardContainer = styled.div`
  margin-bottom: 35px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;


const ExerciseName = styled.h2`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.4rem;
  margin: 0;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
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
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  padding: 8px 15px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
  }
`;

const CalcButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  height: fit-content;
  margin-left: 15px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SetsGridHeader = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 105px;
  gap: 12px;
  padding: 0 10px;
  margin: 20px 0 8px 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
  text-align: center;
  span:first-child { text-align: left; }
  span:last-child { text-align: right; }
`;

const MoreActionsButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 30px;
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#1F1F1F'};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10;
  overflow: hidden;

  button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.textMain};
    padding: 10px 15px;
    font-size: 0.9rem;
    cursor: pointer;
    &:hover {
      background-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.textDark};
    }
  }
`;

const ExerciseLiveCard = ({ planExercise, trainingId, workoutPlanId, onSetComplete, onLogDeleted }) => {
const { authState } = useAuth();
const [lastPerformanceText, setLastPerformanceText] = useState('');
const [lastPerformanceData, setLastPerformanceData] = useState({ weight: '', reps: '' });
const [historyError, setHistoryError] = useState('');
const [sharedWeight, setSharedWeight] = useState('');
const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({ id: `initial-${i}` }));
    setSets(initialSets);
  }, [planExercise]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const fetchHistory = useCallback(async () => {
    if (!authState.token || !planExercise.id) return;
    try {
      const history = await getMyPerformanceHistoryForExerciseService(planExercise.id, authState.token);
      if (history && history.length > 0) {
        const lastSession = history[0];
        setLastPerformanceText(`Reps: ${lastSession.performedReps || '-'}, Peso: ${lastSession.performedWeight || '-'}kg`);
        setLastPerformanceData({
            weight: lastSession.performedWeight || '',
            reps: lastSession.performedReps || ''
        });
      } else {
        setLastPerformanceText('Ainda não há registos para este exercício.');
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
      { id: Date.now(), setNumber: prevSets.length + 1, prescribedReps: planExercise.reps }
    ]);
  };

  const handleDuplicateSet = (baseWeight, baseReps) => {
    setSets(prevSets => [
      ...prevSets,
      { 
        id: Date.now(), 
        setNumber: prevSets.length + 1, 
        prescribedReps: planExercise.reps,
        // Adicionamos valores iniciais para a nova linha
        lastWeight: baseWeight,
        lastReps: baseReps
      }
    ]);
  };
  
  const handleDeleteSet = (setIdToDelete) => {
    setSets(prevSets => prevSets.filter(set => set.id !== setIdToDelete));
    // Também remove o log do estado da página principal
    onLogDeleted(setIdToDelete);
  };

  const handleWeightFromCalculator = (selectedWeight) => {
    setSharedWeight(selectedWeight); // Atualiza o peso partilhado para todas as séries
    setShowCalculator(false);
  };

  
return (
    <CardContainer>
      <CardHeader>
        <ExerciseName>{planExercise.exerciseDetails.name}</ExerciseName>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <MoreActionsButton onClick={() => setMenuOpen(prev => !prev)}>
            <FaEllipsisH />
          </MoreActionsButton>
          {menuOpen && (
            <DropdownMenu>
              <button onClick={() => { console.log('Criar Supersérie!'); setMenuOpen(false); }}>Criar Supersérie</button>
              {/* Outras opções podem ser adicionadas aqui no futuro */}
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
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
            onDeleteSet={() => handleDeleteSet(set.id)}
          />
        ))}
      </div>

      <AddSetButton onClick={handleAddSet}><FaPlus /> Adicionar Série</AddSetButton>
    </CardContainer>
  );
};

export default ExerciseLiveCard;