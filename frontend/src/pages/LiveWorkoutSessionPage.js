// src/pages/LiveWorkoutSessionPage.js - VERSÃO "STRONG"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlansByTrainingId, getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService';
import { FaArrowLeft, FaStopwatch, FaFlagCheckered } from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard';
import RestTimer from '../components/Workout/RestTimer';
import SupersetCard from '../components/Workout/SupersetCard';
import { checkPersonalRecordsService } from '../services/progressService'; 

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 80px clamp(15px, 4vw, 40px) 120px; /* Padding para não ficar debaixo do header/footer */
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const SessionHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px clamp(15px, 4vw, 40px);
  position: fixed;
  top: 60px; /* Altura da sua Navbar principal */
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 900;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  max-width: 800px;
  margin: 0 auto;
`;

const SessionTitle = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  text-align: center;
  font-weight: 600;
`;

const SessionTimer = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const Footer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  justify-content: center;
`;

const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  width: 100%;
  max-width: 400px;
  padding: 15px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
`;

const LoadingText = styled.p` text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem; `;
const ErrorText = styled.p` text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px; `;

const LiveWorkoutSessionPage = () => {
  const { globalPlanId, trainingId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();

  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionName, setSessionName] = useState('Sessão de Treino');
  const [sessionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState({ active: false, duration: 90, key: 0 });
  const [completedSets, setCompletedSets] = useState([]);
  const [isSelectionModeActive, setSelectionModeActive] = useState(false);
  const [supersetSelection, setSupersetSelection] = useState([]);
  const [supersetGroups, setSupersetGroups] = useState([]);

  const fetchPlan = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    setError('');
    try {
        let finalPlanData;
        if (trainingId) {
            const plans = await getWorkoutPlansByTrainingId(trainingId, authState.token);
            if (!plans || plans.length === 0) throw new Error("Este treino não tem um plano associado.");
            finalPlanData = plans[0]; 
            setSessionName(finalPlanData.trainingSessions[0]?.name || "Treino Agendado");
        } else if (globalPlanId) {
            finalPlanData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
            setSessionName(finalPlanData.name);
        } else {
            throw new Error("Nenhum plano de treino especificado.");
        }
        setWorkoutPlan(finalPlanData);

    } catch (err) {
        setError(err.message || 'Não foi possível carregar o plano de treino.');
        setWorkoutPlan(null); 
    } finally {
        setLoading(false);
    }
  }, [globalPlanId, trainingId, authState.token]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);
  
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [sessionStartTime]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSetComplete = (performanceData, restDuration) => {
    setCompletedSets(prev => [...prev, performanceData]);
    const duration = restDuration !== null && restDuration !== undefined ? restDuration : 90;
    setActiveRestTimer({ active: true, duration: duration, key: Date.now() });
  };

  const handleLogDeleted = (deletedLogId) => {
    setCompletedSets(prev => prev.filter(set => set.id !== deletedLogId));
  };
  
  const handleFinishWorkout = async () => {
    if (window.confirm("Tens a certeza que queres terminar o treino?")) {
        try {
            const prData = await checkPersonalRecordsService(completedSets, authState.token); 
            const allPlanExercises = workoutPlan?.planExercises || [];
            
            navigate('/treino/resumo', {
                state: {
                    sessionData: completedSets,
                    duration: elapsedTime,
                    workoutName: sessionName,
                    allPlanExercises: allPlanExercises,
                    personalRecords: prData.records || []
                }
            });
        } catch (error) {
            console.error("Erro ao finalizar treino e verificar PRs:", error);
            navigate('/treino/resumo', { state: { sessionData: completedSets, duration: elapsedTime, workoutName: sessionName, personalRecords: [] } });
        }
    }
  };

  const handleStartSuperset = (exerciseId) => {
    setSelectionModeActive(true);
    setSupersetSelection([exerciseId]); // Começa a seleção com o exercício que foi clicado
  };

  const handleToggleExerciseSelection = (exerciseId) => {
    if (!supersetSelection.includes(exerciseId)) {
        setSupersetSelection(prev => [...prev, exerciseId]); // Seleciona
    }
  };

  const handleConfirmSuperset = () => {
    if (supersetSelection.length > 1) {
      setSupersetGroups(prev => [...prev, supersetSelection]);
    }
    // Reset
    setSelectionModeActive(false);
    setSupersetSelection([]);
  };

  const handleCancelSuperset = () => {
    setSelectionModeActive(false);
    setSupersetSelection([]);
  }

const exerciseBlocks = useMemo(() => {
    // O workoutPlan pode ser um array, pegamos o primeiro.
    const currentPlan = Array.isArray(workoutPlan) ? workoutPlan[0] : workoutPlan;
    const exercises = currentPlan?.planExercises;

    if (!exercises || exercises.length === 0) return [];

    // Usamos um objeto para agrupar exercícios pelo 'supersetGroup'
    const groups = exercises.reduce((acc, exercise) => {
      // Usamos o nome de campo correto: supersetGroup
      const blockId = exercise.supersetGroup;
      if (!acc[blockId]) {
        acc[blockId] = [];
      }
      acc[blockId].push(exercise);
      return acc;
    }, {});

    // Convertemos o objeto de grupos num array de arrays, já ordenado pelas chaves
    return Object.values(groups);
  }, [workoutPlan]);


  if (loading) return <PageContainer><LoadingText>A carregar sessão...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <>
      <SessionHeader>
        <BackLink to="/dashboard" title="Sair do Treino"><FaArrowLeft /></BackLink>
        <SessionTimer><FaStopwatch /> {formatTime(elapsedTime)}</SessionTimer>
      </SessionHeader>

      <PageContainer>
        <SessionTitle>{sessionName}</SessionTitle>

        {/* --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA --- */}
        {exerciseBlocks.map((block) => {
          // A key deve ser única para o bloco. Usamos o ID do primeiro exercício do bloco.
          const blockKey = `block-${block[0].id}`;

          if (block.length > 1) {
            // Se o bloco tem mais de 1 exercício, é uma supersérie
            return (
              <SupersetCard 
                key={blockKey} 
                group={block}
                trainingId={trainingId}
                workoutPlanId={(Array.isArray(workoutPlan) ? workoutPlan[0] : workoutPlan)?.id}
                onSetComplete={handleSetComplete}
              />
            );
          } else if (block.length === 1) {
            // Se o bloco tem apenas 1 exercício, é um exercício normal
            const exercise = block[0];
            return (
              <ExerciseLiveCard
                key={exercise.id}
                planExercise={exercise}
                trainingId={trainingId}
                workoutPlanId={(Array.isArray(workoutPlan) ? workoutPlan[0] : workoutPlan)?.id}
                onSetComplete={handleSetComplete}
                onLogDeleted={handleLogDeleted}
                // Nota: A criação de superséries pelo cliente pode ser desativada se for só o admin a criar
                onStartSuperset={handleStartSuperset} 
                isSelectionModeActive={isSelectionModeActive}
                isSelected={supersetSelection.includes(exercise.id)}
                onToggleSelect={handleToggleExerciseSelection}
              />
            );
          }
          return null; // Bloco vazio não renderiza nada
        })}
      </PageContainer>
      
      <Footer>
        {isSelectionModeActive ? (
            <>
                <FinishWorkoutButton onClick={handleCancelSuperset}>Cancelar</FinishWorkoutButton>
                <FinishWorkoutButton onClick={handleConfirmSuperset} primary>
                    Agrupar {supersetSelection.length} Exercícios
                </FinishWorkoutButton>
            </>
        ) : (
             <FinishWorkoutButton onClick={handleFinishWorkout}>Concluir Treino</FinishWorkoutButton>
        )}
      </Footer>
      
      {activeRestTimer.active && ( <RestTimer key={activeRestTimer.key} duration={activeRestTimer.duration} onFinish={() => setActiveRestTimer(prev => ({ ...prev, active: false }))} /> )}
    </>
  );
};

export default LiveWorkoutSessionPage;