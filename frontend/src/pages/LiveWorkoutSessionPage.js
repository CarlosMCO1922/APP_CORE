// src/pages/LiveWorkoutSessionPage.js - VERSÃO CORRIGIDA E SIMPLIFICADA
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useWorkout } from '../context/WorkoutContext';
import { FaChevronDown, FaStopwatch, FaTimes, FaHistory, FaEllipsisV } from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard'; 
import RestTimer from '../components/Workout/RestTimer'; 
import SupersetCard from '../components/Workout/SupersetCard'; 
import { getExerciseHistoryService } from '../services/progressService'; 
import ExerciseHistoryModal from '../components/Workout/ExerciseHistoryModal'; 

// --- Styled Components (Definições movidas para o topo) ---
const PageContainer = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1100; overflow-y: auto;
  padding: 80px clamp(15px, 4vw, 40px) 120px;
`;
const SessionHeader = styled.header`
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px clamp(15px, 4vw, 40px); position: fixed;
  top: 0; left: 0; right: 0;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1200; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const SessionTitle = styled.h1`
  font-size: 1.5rem; color: ${({ theme }) => theme.colors.textMain};
  margin-top: 20px; text-align: center; font-weight: 600;
`;
const SessionTimer = styled.div`
  font-size: 1.2rem; font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;
const Footer = styled.div`
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 15px; background-color: ${({ theme }) => theme.colors.background};
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3); z-index: 1200;
  display: flex; gap: 10px; justify-content: center;
`;
const FooterButton = styled.button`
  flex: 1; padding: 15px; border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1.1rem; font-weight: bold; cursor: pointer;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
`;
const FinishButton = styled(FooterButton)`
  background-color: ${({ theme }) => theme.colors.success}; color: white;
`;
const CancelButton = styled(FooterButton)`
  background-color: ${({ theme }) => theme.colors.error}; color: white;
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

const LiveWorkoutSessionPage = () => {
  // DADOS VÊM EXCLUSIVAMENTE DO CONTEXTO. Sem useParams, sem fetch local.
  const { activeWorkout, finishWorkout, cancelWorkout, logSet, setIsMinimized } = useWorkout();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState({ active: false, duration: 90, key: 0 });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');

  // Lógica do cronómetro que depende do 'activeWorkout' do contexto
  useEffect(() => {
    if (!activeWorkout) return;
    setElapsedTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000)); // Valor inicial
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeWorkout]);

  const exerciseBlocks = useMemo(() => {
    if (!activeWorkout || !activeWorkout.planExercises) return [];

    // Agrupa exercícios pelo 'supersetGroup'. Exercícios sem grupo ficam sozinhos.
    const groups = activeWorkout.planExercises.reduce((acc, exercise) => {
      const groupId = exercise.supersetGroup || `single_${exercise.id}`;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(exercise);
      return acc;
    }, {});

    // Ordena os grupos pela 'order' do primeiro exercício de cada grupo
    return Object.values(groups).sort((a, b) => a[0].order - b[0].order);
  }, [activeWorkout]);

  const handleSetComplete = (performanceData) => {
    const fullSetData = {
      ...performanceData,
      workoutPlanId: activeWorkout.id, // ID do plano de treino global
      performedAt: new Date().toISOString(), // Timestamp do momento
      trainingId: activeWorkout.trainingId || null, 
    };
    logSet(fullSetData); 
    const restDuration = performanceData.restSeconds ?? 90;
    setActiveRestTimer({ active: true, duration: restDuration, key: Date.now() });
  };
  
  const handleShowHistory = async (exercise) => {
    setLoadingHistory(true);
    setSelectedExerciseName(exercise.name);
    setIsHistoryModalOpen(true);
    try {
      const data = await getExerciseHistoryService(exercise.id);
      setHistoryData(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  // Se não houver treino ativo, o componente não renderiza nada (controlado pelo App.js)
  if (!activeWorkout) return null;

  return (
    <>
      <PageContainer>
        <SessionHeader>
          <button onClick={() => setIsMinimized(true)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white'}}>
            <FaChevronDown />
          </button>
          <SessionTimer><FaStopwatch /> {formatTime(elapsedTime)}</SessionTimer>
        </SessionHeader>

        <SessionTitle>{activeWorkout.name}</SessionTitle>

        {exerciseBlocks.map((block, index) => {
          if (block.length === 1) {
            const planExercise = block[0];
            return (
              <div key={planExercise.id} style={{ position: 'relative', marginBottom: '20px' }}>
                <ExerciseLiveCard
                  planExercise={planExercise}
                  onSetComplete={handleSetComplete}
                />
                <ExerciseActions>
                  <ActionButton onClick={() => handleShowHistory(planExercise.exerciseDetails)} title="Ver Histórico">
                    <FaHistory />
                  </ActionButton>
                  <ActionButton onClick={() => alert('Menu de opções do exercício')} title="Opções">
                    <FaEllipsisV />
                  </ActionButton>
                </ExerciseActions>
              </div>
            );
          } 
          else {
            return (
              <SupersetCard key={`superset-${index}`} exercises={block} onSetComplete={handleSetComplete} onShowHistory={handleShowHistory}/>
            );
          }
        })}
        
        <div style={{ height: '80px' }} /> 

        <Footer>
          <CancelButton onClick={cancelWorkout}><FaTimes /> Cancelar</CancelButton>
          <FinishButton onClick={finishWorkout}>Concluir Treino</FinishButton>
        </Footer>
      </PageContainer>
      
      {isHistoryModalOpen && (
        <ExerciseHistoryModal 
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          data={historyData}
          isLoading={loadingHistory}
          exerciseName={selectedExerciseName}
        />
      )}

      {activeRestTimer.active && ( <RestTimer key={activeRestTimer.key} duration={activeRestTimer.duration} onFinish={() => setActiveRestTimer({ ...activeRestTimer, active: false })} /> )}
    </>
  );
};

export default LiveWorkoutSessionPage;