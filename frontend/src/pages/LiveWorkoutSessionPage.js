// src/pages/LiveWorkoutSessionPage.js - VERSÃO CORRIGIDA E SIMPLIFICADA
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { FaChevronDown, FaStopwatch, FaTimes, FaHistory, FaEllipsisV } from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard'; 
import SupersetCard from '../components/Workout/SupersetCard';
import RestTimer from '../components/Workout/RestTimer'; 
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

const BlockContainer = styled.div`
  background-color: ${({ theme, isSuperset }) => isSuperset ? theme.colors.cardBackground : 'transparent'};
  border-left: ${({ theme, isSuperset }) => isSuperset ? `4px solid ${theme.colors.primary}` : 'none'};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: ${({ isSuperset }) => isSuperset ? '20px' : '0'};
  margin-bottom: 20px;
  box-shadow: ${({ isSuperset }) => isSuperset ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'};
`;

const ExerciseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ExerciseTitle = styled.h2`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.3rem;
  margin: 0;
`;

const ExerciseActions = styled.div`
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
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const LiveWorkoutSessionPage = () => {
  const { authState } = useAuth();
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
        if (!activeWorkout || !activeWorkout.planExercises || activeWorkout.planExercises.length === 0) {
            return [];
        }

        // A lista de exercícios já vem ordenada corretamente do backend
        const exercisesInOrder = activeWorkout.planExercises;
        
        const blocks = [];
        let currentBlock = [exercisesInOrder[0]]; // Começa o primeiro bloco com o primeiro exercício

        // Percorre a lista a partir do segundo exercício
        for (let i = 1; i < exercisesInOrder.length; i++) {
            const currentExercise = exercisesInOrder[i];
            const prevExercise = exercisesInOrder[i - 1];

            // Verifica se o exercício atual pode ser agrupado com o anterior
            const canBeGrouped = 
                currentExercise.supersetGroup != null && // Tem de ter um grupo
                currentExercise.supersetGroup !== 0 &&    // O grupo não pode ser '0' (individual)
                currentExercise.supersetGroup === prevExercise.supersetGroup; // O grupo tem de ser o mesmo do anterior

            if (canBeGrouped) {
                // Se pode ser agrupado, adiciona ao bloco atual
                currentBlock.push(currentExercise);
            } else {
                // Se não pode, significa que o bloco anterior terminou. Guarda-o.
                blocks.push(currentBlock);
                // E começa um novo bloco com o exercício atual.
                currentBlock = [currentExercise];
            }
        }

        // Adiciona o último bloco que estava a ser construído
        blocks.push(currentBlock);

        return blocks;

    }, [activeWorkout]);
  

  const handleSetComplete = (performanceData) => {
    const fullSetData = { /* ... (código igual, está correto) ... */ };
    logSet(fullSetData); 
    const restDuration = performanceData.restSeconds ?? 90;
    setActiveRestTimer({ active: true, duration: restDuration, key: Date.now() });
  };
  
  const handleShowHistory = async (exercise) => {
    setLoadingHistory(true);
    setSelectedExerciseName(exercise.name);
    setIsHistoryModalOpen(true);
    try {
      const data = await getExerciseHistoryService(exercise.id, authState.token);
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
                    const isSuperset = block.length > 1;

                    if (isSuperset) {
                        return (
                            <SupersetCard
                                key={`superset-${block[0].supersetGroup || index}`}
                                exercises={block}
                                onSetComplete={handleSetComplete}
                                onShowHistory={handleShowHistory}
                                trainingId={activeWorkout.trainingId || null}
                                workoutPlanId={activeWorkout.id}
                            />
                        );
                    } else {
                        const planExercise = block[0];
                        return (
                            <div key={planExercise.id} style={{ marginBottom: '40px' }}>
                                <ExerciseHeader>
                                    <ExerciseTitle>{planExercise.exerciseDetails.name}</ExerciseTitle>
                                    <ExerciseActions>
                                        <ActionButton onClick={() => handleShowHistory(planExercise.exerciseDetails)} title="Ver Histórico"><FaHistory /></ActionButton>
                                        <ActionButton onClick={() => alert('Menu de opções do exercício')} title="Opções"><FaEllipsisV /></ActionButton>
                                    </ExerciseActions>
                                </ExerciseHeader>
                                <ExerciseLiveCard
                                    planExercise={planExercise}
                                    onSetComplete={handleSetComplete}
                                    trainingId={activeWorkout.trainingId || null}
                                    workoutPlanId={activeWorkout.id}
                                />
                            </div>
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