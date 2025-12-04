// src/pages/LiveWorkoutSessionPage.js - VERSÃO CORRIGIDA E SIMPLIFICADA
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { logger } from '../utils/logger';
import useWakeLock from '../hooks/useWakeLock';
import { FaChevronDown, FaStopwatch, FaTimes, FaHistory } from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard'; 
import SupersetCard from '../components/Workout/SupersetCard';
import RestTimer from '../components/Workout/RestTimer'; 
import { getExerciseHistoryService } from '../services/progressService'; 
import ExerciseHistoryModal from '../components/Workout/ExerciseHistoryModal';
import ConfirmationModal from '../components/Common/ConfirmationModal'; 

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
  const { activeWorkout, finishWorkout, cancelWorkout, logSet, setIsMinimized, lastPerformances} = useWorkout();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState({ active: false, duration: 90, key: 0 });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [lastCompletedSet, setLastCompletedSet] = useState(null);
  const [showCancelWorkoutModal, setShowCancelWorkoutModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Manter o ecrã ligado durante o treino
  useWakeLock(!!activeWorkout);

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

    // Ordenar exercícios: primeiro por order (bloco), depois por internalOrder (ordem dentro do bloco)
    const exercisesInOrder = [...activeWorkout.planExercises].sort((a, b) => {
      const orderA = a.order !== null && a.order !== undefined ? a.order : 0;
      const orderB = b.order !== null && b.order !== undefined ? b.order : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
      const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
      return internalOrderA - internalOrderB;
    });
    
    // Usamos 'reduce' para agrupar por 'order', que representa a ordem dos blocos.
    const blocksByOrder = exercisesInOrder.reduce((acc, exercise) => {
      const blockOrder = exercise.order !== null && exercise.order !== undefined ? exercise.order : 0;
      
      // Se ainda não vimos este bloco, criamos uma nova lista para ele.
      if (!acc[blockOrder]) {
        acc[blockOrder] = [];
      }
      
      // Adicionamos o exercício ao seu respetivo bloco.
      acc[blockOrder].push(exercise);
      
      return acc;
    }, {});

    // O resultado de 'reduce' é um objeto. Convertemos para uma lista de blocos.
    // Ordenar as chaves do objeto para garantir ordem correta dos blocos
    const sortedBlockOrders = Object.keys(blocksByOrder).map(Number).sort((a, b) => a - b);
    // Ordenar os exercícios dentro de cada bloco por internalOrder
    return sortedBlockOrders.map(order => {
      const block = blocksByOrder[order];
      return block.sort((a, b) => {
        const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
        const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
        return internalOrderA - internalOrderB;
      });
    });

  }, [activeWorkout]);

  const planToExerciseId = useMemo(() => {
    const map = {};
    (activeWorkout?.planExercises || []).forEach(pe => {
      const planId = pe.id ?? pe.planExerciseId;
      const exId = pe.exerciseDetails?.id;
      if (planId && exId) map[planId] = exId;
    });
    return map;
  }, [activeWorkout]);
  

  const handleSetComplete = (performanceData) => {
    const {
      planExerciseId,
      setNumber,
      performedWeight,
      performedReps,
      restSeconds
    } = performanceData;

    const exerciseId = planToExerciseId[planExerciseId];
    if (!exerciseId) {
      logger.warn('Não foi possível mapear planExerciseId -> exerciseId', { planExerciseId, performanceData });
    }

    const fullSetData = {
      trainingId: activeWorkout.trainingId || null,
      workoutPlanId: activeWorkout.id,
      planExerciseId,
      exerciseId,
      setNumber,
      weight: Number(performedWeight),
      reps: Number(performedReps),
      weightKg: Number(performedWeight),
      performedWeight: Number(performedWeight),
      performedReps: Number(performedReps),
      performedAt: new Date().toISOString(),
    };

    logSet(fullSetData);
    
    // Guardar informação sobre a série completada para processar depois
    setLastCompletedSet({ planExerciseId, setNumber, restSeconds });
  };
  
  // useEffect para processar o tempo de descanso após o setsData ser atualizado
  useEffect(() => {
    if (!lastCompletedSet || !activeWorkout) return;
    
    const { planExerciseId, setNumber, restSeconds } = lastCompletedSet;
    
    // Encontrar o bloco ao qual este exercício pertence
    const currentBlock = exerciseBlocks.find(block => 
      block.some(ex => {
        const exId = ex.id || ex.planExerciseId;
        return exId === planExerciseId;
      })
    );
    
    if (!currentBlock) {
      setLastCompletedSet(null);
      return;
    }
    
    const isSuperset = currentBlock.length > 1;
    
    let shouldShowRestTimer = false;
    
    if (!isSuperset) {
      // Se não for supersérie, mostrar sempre após cada série
      shouldShowRestTimer = true;
    } else {
      // Se for supersérie, só mostrar timer quando completar série do ÚLTIMO exercício do bloco
      // Ordenar o bloco para garantir ordem correta
      const sortedBlock = [...currentBlock].sort((a, b) => {
        // Usar internalOrder se disponível, senão usar a ordem no array
        const orderA = a.internalOrder !== undefined ? a.internalOrder : currentBlock.indexOf(a);
        const orderB = b.internalOrder !== undefined ? b.internalOrder : currentBlock.indexOf(b);
        return orderA - orderB;
      });
      
      const lastExerciseInBlock = sortedBlock[sortedBlock.length - 1];
      const lastExerciseId = lastExerciseInBlock.id || lastExerciseInBlock.planExerciseId;
      
      // Só mostrar timer se a série completada foi do último exercício do bloco
      if (lastExerciseId === planExerciseId) {
        shouldShowRestTimer = true;
      }
    }

    if (shouldShowRestTimer) {
      const restDuration = restSeconds ?? 90;
      setActiveRestTimer({ active: true, duration: restDuration, key: Date.now() });
    }
    
    // Reset
    setLastCompletedSet(null);
  }, [activeWorkout?.setsData, lastCompletedSet, exerciseBlocks]);
  
  const handleShowHistory = async (exercise) => {
    setLoadingHistory(true);
    setSelectedExerciseName(exercise.name);
    setIsHistoryModalOpen(true);
    try {
      const data = await getExerciseHistoryService(exercise.id, authState.token);
      // mantém só as 3 mais recentes (assumindo que já vem ordenado desc; se não, ordena por createdAt desc antes)
      setHistoryData((data || []).slice(0, 3));
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
                                lastPerformances={lastPerformances}
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
                                    </ExerciseActions>
                                </ExerciseHeader>
                                <ExerciseLiveCard
                                    planExercise={planExercise}
                                    exerciseName={null}
                                    onSetComplete={handleSetComplete}
                                    trainingId={activeWorkout.trainingId || null}
                                    workoutPlanId={activeWorkout.id}
                                    lastPerformance={lastPerformances[planExercise.exerciseDetails.id]}
                                />
                            </div>
                );
              }
            })}
            
            <div style={{ height: '80px' }} /> 

            <Footer>
              <CancelButton onClick={() => setShowCancelWorkoutModal(true)} disabled={isFinishing}><FaTimes /> Cancelar</CancelButton>
              <FinishButton onClick={async () => {
                if (isFinishing) return;
                setIsFinishing(true);
                try {
                  await finishWorkout();
                } catch (err) {
                  logger.error('Erro ao concluir treino:', err);
                } finally {
                  setIsFinishing(false);
                }
              }} disabled={isFinishing}>
                {isFinishing ? 'A concluir...' : 'Concluir Treino'}
              </FinishButton>
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

            <ConfirmationModal
                isOpen={showCancelWorkoutModal}
                onClose={() => setShowCancelWorkoutModal(false)}
                onConfirm={() => {
                    setShowCancelWorkoutModal(false);
                    cancelWorkout();
                }}
                title="Cancelar Treino"
                message="Tem a certeza? Todos os dados registados serão perdidos."
                confirmText="Cancelar Treino"
                cancelText="Continuar"
                danger={true}
                loading={false}
            />
          </>
        );
      };

export default LiveWorkoutSessionPage;