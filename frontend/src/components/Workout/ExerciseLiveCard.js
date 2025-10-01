// src/components/Workout/ExerciseLiveCard.js

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getMyPerformanceHistoryForExerciseService } from '../../services/progressService';
import { FaDumbbell, FaHistory, FaCalculator} from 'react-icons/fa';
import SetRow from './SetRow';
import PlateCalculatorModal from './PlateCalculatorModal';
import ExerciseDetailModal from './ExerciseDetailModal';

const CardContainer = styled.div`
  margin-bottom: 35px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const HeaderInfo = styled.div`
    flex-grow: 1;
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

const ExerciseLiveCard = ({ planExercise, trainingId, workoutPlanId, onSetComplete, onLogDeleted}) => {
  const { authState } = useAuth();
  const [sets, setSets] = useState([]);
  const [lastPerformanceText, setLastPerformanceText] = useState('A carregar histórico...');
  const [lastPerformanceData, setLastPerformanceData] = useState({ weight: '', reps: '' });
  const [historyError, setHistoryError] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [sharedWeight, setSharedWeight] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({
      id: i,
      setNumber: i + 1,
      prescribedReps: planExercise.reps,
    }));
    setSets(initialSets);
  }, [planExercise]);

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
    <>
      <CardContainer>
        <CardHeader>
          <ExerciseName onClick={() => setIsDetailModalOpen(true)}>
            {planExercise.exerciseDetails.name}
          </ExerciseName>
        </CardHeader>
        <LastPerformance><FaHistory /> {historyError || lastPerformanceText}</LastPerformance>
        
        <SetsGridHeader>
          <span>Série</span>
          <span>Peso (kg)</span>
          <span>Reps</span>
          <span></span>
        </SetsGridHeader>
        
        <div>
          {sets.map((set, index) => (
            <SetRow
              key={set.id}
              setId={set.id}
              setNumber={index + 1}
              // ...outras props...
              onDeleteSet={() => handleDeleteSet(set.id)}
            />
          ))}
        </div>

        <AddSetButton onClick={handleAddSet}><FaPlus /> Adicionar Série</AddSetButton>
      </CardContainer>

      {showCalculator && (
        <PlateCalculatorModal
          onClose={() => setShowCalculator(false)}
          onSelectWeight={handleWeightFromCalculator}
        />
      )}
      
      {isDetailModalOpen && (
        <ExerciseDetailModal
          exercise={planExercise.exerciseDetails}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </>
  );
};

export default ExerciseLiveCard;