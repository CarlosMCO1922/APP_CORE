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
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius};
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: ${({ theme }) => theme.boxShadow};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const HeaderInfo = styled.div`
    flex-grow: 1;
`;

const ExerciseName = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.6rem;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    filter: brightness(1.1);
  }
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
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; /* MUDOU */
  color: ${({ theme }) => theme.colors.textMain}; /* MUDOU */
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
      { id: Date.now(), setNumber: prevSets.length + 1, prescribedReps: planExercise.reps } // Usar Date.now() para um ID único
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
    setSets(prevSets => {
      const filteredSets = prevSets.filter(set => set.id !== setIdToDelete);
      // Re-numera as séries para manter a ordem correta
      return filteredSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }));
    });
  };

  const handleWeightFromCalculator = (selectedWeight) => {
    setSharedWeight(selectedWeight); // Atualiza o peso partilhado para todas as séries
    setShowCalculator(false);
  };

  
  return (
    <>
      <CardContainer>
        <CardHeader>
          <HeaderInfo>
            <ExerciseName onClick={() => setIsDetailModalOpen(true)}>
              <FaDumbbell /> {planExercise.exerciseDetails.name}
            </ExerciseName>
            <LastPerformance>
              <FaHistory /> {historyError || lastPerformanceText}
            </LastPerformance>
          </HeaderInfo>
        </CardHeader>
        <SetsGridHeader>
          <span>Série</span>
          <span>Peso (kg)</span>
          <span>Reps</span>
          <span></span> {/* Espaço para os botões de ação */}
        </SetsGridHeader>
        
        <div>
          {sets.map((set) => (
            <SetRow
              key={set.id}
              setId={set.id}
              setNumber={index + 1}
              prescribedReps={set.prescribedReps}
              trainingId={trainingId}
              workoutPlanId={workoutPlanId}
              planExerciseId={planExercise.id}
              onSetComplete={onSetComplete}
              restSeconds={planExercise.restSeconds}
              lastWeight={sharedWeight !== null ? sharedWeight : lastPerformanceData.weight}
              lastReps={lastPerformanceData.reps}
              onDeleteSet={handleDeleteSet}
              onLogDeleted={onLogDeleted}
              initialWeight={set.initialWeight} // Passa os valores iniciais
              initialReps={set.initialReps}
              onDuplicateSet={handleDuplicateSet} 
            />
          ))}
        </div>

        <AddSetButton onClick={handleAddSet}>+ Adicionar Série</AddSetButton>
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